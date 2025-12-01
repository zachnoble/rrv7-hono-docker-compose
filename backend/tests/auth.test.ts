import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { sessions, users, verificationTokens } from '~/db/models'
import { basicSession, basicUser, basicVerificationToken } from './lib/fixtures'
import { client } from './lib/test-client'
import type { Mock } from './lib/types'

describe('Auth Routes', () => {
	beforeAll(() => {
		// Hashing passwords is expensive; huge speed improvement by mocking with minimum salt rounds
		mock.module('~/services/auth/auth-fns', () => {
			return {
				hashPassword: async (password: string) => await bcrypt.hash(password, 2),
			}
		})
	})

	describe('POST /auth/login', () => {
		it('should login with valid credentials', async () => {
			const user = await basicUser()

			const res = await client.post('/auth/login', {
				email: user.email,
				password: user.password,
			})
			expect(res.status).toBe(200)

			const cookieHeader = res.headers.get('set-cookie')
			expect(cookieHeader).toContain('sessionId=')

			const signedSessionId = cookieHeader?.split('sessionId=')[1]?.split(';')[0]
			const sessionIdLength = 128
			expect(signedSessionId?.length).toBeGreaterThan(sessionIdLength)

			const [session] = await db.select().from(sessions).where(eq(sessions.userId, user.id))
			expect(session).toBeDefined()

			expect(session.sessionId.length).toBe(sessionIdLength)
			expect(session.userId).toBe(user.id)
		})

		it('should not login if user is not verified', async () => {
			const user = await basicUser({ isVerified: false })

			const res = await client.post('/auth/login', {
				email: user.email,
				password: user.password,
			})
			expect(res.status).toBe(403)

			const allSessions = await db.select().from(sessions)
			expect(allSessions.length).toBe(0)
		})

		it('should not login with invalid password', async () => {
			const user = await basicUser()

			const res = await client.post('/auth/login', {
				email: user.email,
				password: 'wrongpassword',
			})
			expect(res.status).toBe(401)

			const allSessions = await db.select().from(sessions)
			expect(allSessions.length).toBe(0)
		})

		it('should not login with invalid email', async () => {
			const user = await basicUser()

			const res = await client.post('/auth/login', {
				email: 'incorrect@email.com',
				password: user.password,
			})
			expect(res.status).toBe(401)
		})

		it('should not login with missing fields', async () => {
			const user = await basicUser()

			const res = await client.post('/auth/login', {
				email: user.email,
			})
			expect(res.status).toBe(422)

			const res2 = await client.post('/auth/login', {
				password: user.password,
			})
			expect(res2.status).toBe(422)

			const res3 = await client.post('/auth/login', {})
			expect(res3.status).toBe(422)

			const res4 = await client.post('/auth/login', {
				email: '',
				password: '',
			})
			expect(res4.status).toBe(422)
		})

		it('should handle logins with several users and mixed up fields', async () => {
			const user1 = await basicUser({
				name: 'User 1',
				email: 'user1@example.com',
				password: 'password123!user1',
			})
			const user2 = await basicUser({
				name: 'User 2',
				email: 'user2@example.com',
				password: 'password123!user2',
			})
			const user3 = await basicUser({
				name: 'User 3',
				email: 'user3@example.com',
				password: 'password123!user3',
			})

			const res = await client.post('/auth/login', {
				email: user2.email,
				password: user1.password,
			})
			expect(res.status).toBe(401)

			const res2 = await client.post('/auth/login', {
				email: user3.email,
				password: user1.password,
			})
			expect(res2.status).toBe(401)

			const res3 = await client.post('/auth/login', {
				email: user1.email,
				password: user2.password,
			})
			expect(res3.status).toBe(401)

			const res4 = await client.post('/auth/login', {
				email: user2.email,
				password: user3.password,
			})
			expect(res4.status).toBe(401)

			const res5 = await client.post('/auth/login', {
				email: user2.email,
				password: user2.password,
			})
			expect(res5.status).toBe(200)
		})
	})

	describe('POST /auth/register', () => {
		it('should register a new user and send a verification email', async () => {
			const data = {
				email: 'test@example.com',
				password: 'Test123!@#$',
				name: 'Test User',
			}
			const res = await client.post('/auth/register', data)
			expect(res.status).toBe(200)

			const [user] = await db.select().from(users).where(eq(users.email, data.email))
			expect(user).toBeDefined()
			expect(user.id).toBeString()
			expect(user.email).toBe(data.email)
			expect(user.name).toBe(data.name)
			expect(user.isVerified).toBe(false)
			if (!user.passwordHash) throw new Error('Password hash is undefined')
			expect(await bcrypt.compare(data.password, user.passwordHash)).toBe(true)

			const [verificationToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.userId, user.id))
			expect(verificationToken).toBeDefined()
			expect(verificationToken.token).toBeDefined()
			expect(verificationToken.expiresAt).toBeDefined()
			expect(verificationToken.expiresAt > new Date()).toBe(true)
			expect(verificationToken.type).toBe('email_verification')
		})

		it('should not register user with existing verified email', async () => {
			const user = await basicUser()

			const res = await client.post('/auth/register', {
				email: user.email,
				password: 'Test123!@#$',
				name: 'Test User',
			})

			expect(res.status).toBe(409)
		})

		it('should allow re-registration with existing unverified email', async () => {
			const unverifiedUser = {
				email: 'unverified@example.com',
				password: 'Test123!@#$',
				name: 'Unverified User',
			}

			const res1 = await client.post('/auth/register', unverifiedUser)
			expect(res1.status).toBe(200)

			const res2 = await client.post('/auth/register', unverifiedUser)
			expect(res2.status).toBe(200)

			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.email, unverifiedUser.email))
			expect(user.isVerified).toBe(false)

			const [verificationToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.userId, user.id))
			expect(verificationToken).toBeDefined()
			expect(verificationToken.token).toBeDefined()
			expect(verificationToken.expiresAt).toBeDefined()
			expect(verificationToken.expiresAt > new Date()).toBe(true)
		})

		it('should allow registration with duplicate name', async () => {
			const user1 = await basicUser()

			const res = await client.post('/auth/register', {
				email: 'different_email@example.com',
				name: user1.name,
				password: 'Test123!@#$',
			})
			expect(res.status).toBe(200)
		})

		it('should reject registration with invalid email', async () => {
			const res = await client.post('/auth/register', {
				email: 'invalid-email',
				password: 'Test123!@#$',
				name: 'Test User',
			})
			expect(res.status).toBe(422)
		})

		it('should reject registration with weak password', async () => {
			const res = await client.post('/auth/register', {
				email: 'weakpass@example.com',
				password: '123',
				name: 'Test User',
			})
			expect(res.status).toBe(422)
		})

		it('should reject registration with missing name', async () => {
			const res = await client.post('/auth/register', {
				email: 'noname@example.com',
				password: 'Test123!@#$',
				name: '',
			})
			expect(res.status).toBe(422)
		})

		it('should reject registration with missing fields', async () => {
			const res = await client.post('/auth/register', {
				email: 'incomplete@example.com',
			})
			expect(res.status).toBe(422)
		})
	})

	describe('POST /auth/forgot-password', () => {
		it('should send password reset email for existing user', async () => {
			const user = await basicUser()

			const res = await client.post('/auth/forgot-password', {
				email: user.email,
			})
			expect(res.status).toBe(200)

			const [passwordResetToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.userId, user.id))
			expect(passwordResetToken).toBeDefined()
			expect(passwordResetToken.token).toBeDefined()
			expect(passwordResetToken.type).toBe('password_reset')
		})

		it('should not reveal if email exists', async () => {
			const res = await client.post('/auth/forgot-password', {
				email: 'nonexistent@example.com',
			})
			expect(res.status).toBe(200)

			const [passwordResetToken] = await db.select().from(verificationTokens).limit(1)
			expect(passwordResetToken).toBeUndefined()
		})
	})

	describe('POST /auth/logout', () => {
		it('should logout user and clear session', async () => {
			const user = await client.authenticate()

			const res = await client.post('/auth/logout')
			expect(res.status).toBe(200)

			expect(res.headers.get('set-cookie')).toContain('sessionId=;')

			const [session] = await db.select().from(sessions).where(eq(sessions.userId, user.id))
			expect(session).toBeUndefined()
		})

		it('should succeed even if session does not exist', async () => {
			await db.delete(sessions)
			const res = await client.post('/auth/logout')
			expect(res.status).toBe(200)
		})
	})

	describe('GET /auth/user', () => {
		it('should return user data when authenticated', async () => {
			const user = await client.authenticate()
			const res = await client.get('/auth/user')

			expect(res.status).toBe(200)
			expect(res.data.email).toBe(user.email)
			expect(res.data.name).toBe(user.name)
			expect(res.data.id).toBe(user.id)
			expect(res.data.passwordHash).toBeUndefined()
		})

		it('should get the correct user when there are multiple authenticated users', async () => {
			const user = await client.authenticate()

			const [user1, user2, user3] = await Promise.all([
				basicUser({ email: 'user1@example.com' }),
				basicUser({ email: 'user2@example.com' }),
				basicUser({ email: 'user3@example.com' }),
			])

			await Promise.all([
				basicSession({ userId: user1.id }),
				basicSession({ userId: user2.id }),
				basicSession({ userId: user3.id }),
			])

			const res = await client.get('/auth/user')

			expect(res.status).toBe(200)
			expect(res.data.email).toBe(user.email)
			expect(res.data.name).toBe(user.name)
			expect(res.data.id).toBe(user.id)
			expect(res.data.passwordHash).toBeUndefined()
		})

		it('should return 401 when not authenticated', async () => {
			const res = await client.get('/auth/user')
			expect(res.status).toBe(401)
		})
	})

	describe('POST /auth/verify-user', () => {
		it('should verify email with valid token', async () => {
			const user = await basicUser({ isVerified: false })
			const verificationToken = await basicVerificationToken({
				userId: user.id,
				type: 'email_verification',
			})

			const res = await client.post('/auth/verify-user', {
				token: verificationToken.token,
				email: user.email,
			})
			expect(res.status).toBe(200)

			const [verifiedUser] = await db.select().from(users).where(eq(users.email, user.email))
			expect(verifiedUser.isVerified).toBe(true)

			const [deletedToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.token, verificationToken.token))
			expect(deletedToken).toBeUndefined()
		})

		it('should not verify email with invalid token', async () => {
			const user = await basicUser({ isVerified: false })
			await basicVerificationToken({ userId: user.id, type: 'email_verification' })

			const res = await client.post('/auth/verify-user', {
				token: 'invalid-token',
				email: user.email,
			})
			expect(res.status).toBe(401)
		})

		it('should not verify email with expired token', async () => {
			const user = await basicUser({ isVerified: false })
			const emailVerificationToken = await basicVerificationToken({
				userId: user.id,
				expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
				type: 'email_verification',
			})

			const res = await client.post('/auth/verify-user', {
				token: emailVerificationToken.token,
				email: user.email,
			})
			expect(res.status).toBe(400)

			const [deletedToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.token, emailVerificationToken.token))
			expect(deletedToken).toBeUndefined()

			const [newToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.userId, user.id))
			expect(newToken).toBeDefined()
			expect(newToken.token).toBeDefined()
			expect(newToken.expiresAt > new Date()).toBe(true)
			expect(newToken.type).toBe('email_verification')
		})
	})

	describe('POST /auth/reset-password', () => {
		it('should reset password with valid token', async () => {
			const user = await basicUser()
			const passwordResetToken = await basicVerificationToken({
				userId: user.id,
				type: 'password_reset',
			})

			const newPassword = 'NewPassword123!@#'

			const res = await client.post('/auth/reset-password', {
				token: passwordResetToken.token,
				email: user.email,
				password: newPassword,
			})
			expect(res.status).toBe(200)

			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id))
			expect(updatedUser.passwordHash).not.toBe(user.passwordHash)
			if (!updatedUser.passwordHash) throw new Error('Password hash is undefined')
			expect(await bcrypt.compare(newPassword, updatedUser.passwordHash)).toBe(true)

			const [deletedToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.token, passwordResetToken.token))
			expect(deletedToken).toBeUndefined()
		})

		it('should not reset password with invalid token', async () => {
			const user = await basicUser()
			const passwordResetToken = await basicVerificationToken({
				userId: user.id,
				type: 'password_reset',
			})

			const res = await client.post('/auth/reset-password', {
				token: 'invalid-token',
				email: user.email,
				password: 'NewPassword123!@#',
			})
			expect(res.status).toBe(401)

			const [existingToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.token, passwordResetToken.token))
			expect(existingToken).toBeDefined()
		})

		it('should not reset password with expired token', async () => {
			const user = await basicUser()
			const passwordResetToken = await basicVerificationToken({
				userId: user.id,
				expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
				type: 'password_reset',
			})

			const res = await client.post('/auth/reset-password', {
				token: passwordResetToken.token,
				email: user.email,
				password: 'NewPassword123!@#',
			})

			expect(res.status).toBe(401)
		})

		it('should not reset password with mismatched email', async () => {
			const user = await basicUser()
			const passwordResetToken = await basicVerificationToken({
				userId: user.id,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				type: 'password_reset',
			})

			const res = await client.post('/auth/reset-password', {
				token: passwordResetToken.token,
				email: 'different@example.com',
				password: 'NewPassword123!@#',
			})
			expect(res.status).toBe(401)
		})
	})

	describe('POST /auth/change-password', () => {
		it('should not change password if not authenticated', async () => {
			const res = await client.post('/auth/change-password', {
				currentPassword: 'test-password123!@#$',
				newPassword: 'NewPassword123!@#',
			})
			expect(res.status).toBe(401)
		})

		it('should change password with valid credentials', async () => {
			const currentPassword = 'authenticated123$%'
			const user = await basicUser({
				password: currentPassword,
			})
			await client.authenticate(user.id)

			const newPassword = 'NewPassword123!@#'
			const res = await client.post('/auth/change-password', {
				currentPassword,
				newPassword,
			})
			expect(res.status).toBe(200)

			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id))
			expect(updatedUser.passwordHash).not.toBe(user.passwordHash)
			if (!updatedUser.passwordHash) throw new Error('Password hash is undefined')
			expect(await bcrypt.compare(newPassword, updatedUser.passwordHash)).toBe(true)
		})

		it('should not change password with invalid current password', async () => {
			const user = await client.authenticate()

			const res = await client.post('/auth/change-password', {
				currentPassword: 'invalid-password',
				newPassword: 'NewPassword123!@#',
			})
			expect(res.status).toBe(401)

			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id))
			expect(updatedUser.passwordHash).toBe(user.passwordHash)
		})

		it('should not change password with weak new password', async () => {
			const currentPassword = 'authenticated123$%'
			const user = await basicUser({
				password: currentPassword,
			})
			await client.authenticate(user.id)

			const res = await client.post('/auth/change-password', {
				currentPassword,
				newPassword: '123',
			})
			expect(res.status).toBe(422)
		})
	})

	describe('POST /auth/google', () => {
		let getGoogleUserInfoMock: Mock

		function mockGoogleUserInfo(googleUserInfo: {
			googleId: string
			email: string
			name: string
		}) {
			getGoogleUserInfoMock.mockResolvedValue(googleUserInfo)
		}

		function mockGoogleUserInfoError(error: Error) {
			getGoogleUserInfoMock.mockImplementation(() => Promise.reject(error))
		}

		beforeAll(() => {
			getGoogleUserInfoMock = mock()
			mock.module('~/services/auth/auth-fns', () => {
				return {
					getGoogleUserInfo: getGoogleUserInfoMock,
				}
			})
		})

		afterEach(() => {
			getGoogleUserInfoMock.mockReset()
		})

		it('should register new user with Google', async () => {
			const googleInfo = {
				googleId: 'new-google-id',
				email: 'new-user@example.com',
				name: 'New User',
			}
			mockGoogleUserInfo(googleInfo)

			const res = await client.post('/auth/google', { googleToken: 'test-google-token' })
			expect(res.status).toBe(200)

			const [newUser] = await db.select().from(users).where(eq(users.email, googleInfo.email))
			expect(newUser).toBeDefined()
			expect(newUser.isVerified).toBe(true)
			expect(newUser.googleId).toBe(googleInfo.googleId)
			expect(newUser.name).toBe(googleInfo.name)
			expect(newUser.passwordHash).toBe(null)
		})

		it('should login existing user with Google', async () => {
			const googleInfo = {
				googleId: 'existing-google-id',
				email: 'existing-google@example.com',
				name: 'Existing Google User',
			}
			mockGoogleUserInfo(googleInfo)

			const existingUser = await basicUser({
				email: googleInfo.email,
				name: googleInfo.name,
				googleId: googleInfo.googleId,
				isVerified: true,
			})

			const res = await client.post('/auth/google', { googleToken: 'test-google-token' })
			expect(res.status).toBe(200)

			const allUsers = await db.select().from(users).where(eq(users.email, googleInfo.email))
			expect(allUsers).toHaveLength(1)
			expect(allUsers[0].id).toBe(existingUser.id)
		})

		it('should link Google account to existing verified email user', async () => {
			const googleInfo = {
				googleId: 'new-google-id-for-linking',
				email: 'existing-email@example.com',
				name: 'Existing Email User',
			}
			mockGoogleUserInfo(googleInfo)

			const existingUser = await basicUser({
				email: googleInfo.email,
				name: googleInfo.name,
				isVerified: true,
			})

			const res = await client.post('/auth/google', { googleToken: 'test-google-token' })
			expect(res.status).toBe(200)

			const [updatedUser] = await db
				.select()
				.from(users)
				.where(eq(users.email, googleInfo.email))
			expect(updatedUser).toBeDefined()
			expect(updatedUser.id).toBe(existingUser.id)
			expect(updatedUser.googleId).toBe(googleInfo.googleId)
			expect(updatedUser.isVerified).toBe(true)
			expect(updatedUser.passwordHash).toBe(existingUser.passwordHash)
		})

		it('should link Google account to existing unverified email user and verify them', async () => {
			const googleInfo = {
				googleId: 'google-id-for-unverified',
				email: 'unverified-email@example.com',
				name: 'Unverified Email User',
			}
			mockGoogleUserInfo(googleInfo)

			const existingUser = await basicUser({
				email: googleInfo.email,
				name: googleInfo.name,
				isVerified: false,
			})

			const res = await client.post('/auth/google', { googleToken: 'test-google-token' })
			expect(res.status).toBe(200)

			const [updatedUser] = await db
				.select()
				.from(users)
				.where(eq(users.email, googleInfo.email))
			expect(updatedUser).toBeDefined()
			expect(updatedUser.id).toBe(existingUser.id)
			expect(updatedUser.googleId).toBe(googleInfo.googleId)
			expect(updatedUser.isVerified).toBe(true)
		})

		it('should handle invalid Google token', async () => {
			mockGoogleUserInfoError(new Error('Invalid Google token'))

			const res = await client.post('/auth/google', { googleToken: 'invalid-google-token' })
			expect(res.status).toBe(500)
		})

		it('should validate Google token parameter', async () => {
			const res = await client.post('/auth/google', {})
			expect(res.status).toBe(422)

			const res2 = await client.post('/auth/google', {
				googleToken: '',
			})
			expect(res2.status).toBe(422)
		})
	})

	describe('E2E Auth Flow', () => {
		it('should register -> verify -> login -> forgot password -> reset password -> login -> change password -> login', async () => {
			const data = {
				email: 'e2etest@example.com',
				password: 'Test123!@#$',
				name: 'E2E Test User',
			}
			const registerRes = await client.post('/auth/register', {
				email: data.email,
				name: data.name,
				password: data.password,
			})
			expect(registerRes.status).toBe(200)

			const [user] = await db.select().from(users).where(eq(users.email, data.email))
			const [verificationToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.userId, user.id))

			const verifyEmailRes = await client.post('/auth/verify-user', {
				token: verificationToken.token,
				email: user.email,
			})
			expect(verifyEmailRes.status).toBe(200)

			const loginRes = await client.post('/auth/login', {
				email: user.email,
				password: data.password,
			})
			expect(loginRes.status).toBe(200)

			await client.authenticate(user.id)
			const logoutRes = await client.post('/auth/logout')
			expect(logoutRes.status).toBe(200)

			const forgotPasswordRes = await client.post('/auth/forgot-password', {
				email: user.email,
			})
			expect(forgotPasswordRes.status).toBe(200)

			const newPassword = 'NewPassword123!@#'
			const [passwordResetToken] = await db
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.userId, user.id))

			const resetPasswordRes = await client.post('/auth/reset-password', {
				token: passwordResetToken.token,
				email: user.email,
				password: newPassword,
			})
			expect(resetPasswordRes.status).toBe(200)

			const loginRes2 = await client.post('/auth/login', {
				email: user.email,
				password: newPassword,
			})
			expect(loginRes2.status).toBe(200)

			await client.authenticate(user.id)
			const changedPassword = 'ChangedPassword123!@#'
			const changePasswordRes = await client.post('/auth/change-password', {
				currentPassword: newPassword,
				newPassword: changedPassword,
			})
			expect(changePasswordRes.status).toBe(200)

			const loginRes3 = await client.post('/auth/login', {
				email: user.email,
				password: changedPassword,
			})
			expect(loginRes3.status).toBe(200)
		})
	})
})
