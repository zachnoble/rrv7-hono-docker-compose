import { db } from '~/db'
import { env } from '~/lib/env'
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '~/lib/errors'
import { sendEmail } from '~/lib/resend'
import { generateSecureToken } from '~/lib/tokens'
import { type UserDal, userDal } from '../user/user-dal'
import {
	type VerificationTokenDal,
	verificationTokenDal,
} from '../verification-token/verification-token-dal'
import {
	TOKEN_EXPIRATION_TIME_MS,
	comparePasswordHash,
	getGoogleUserInfo,
	hashPassword,
	passwordResetEmailHtml,
	verificationEmailHtml,
} from './auth-fns'
import type {
	ChangePasswordDTO,
	LoginDTO,
	ResetPasswordDTO,
	SendVerificationEmailDTO,
	VerifyUserDTO,
	VerifyUserResultDTO,
} from './auth-types'

type Props = {
	userDal: UserDal
	verificationTokenDal: VerificationTokenDal
}

function getAuthService({ userDal, verificationTokenDal }: Props) {
	async function validateCredentials({ email, password }: LoginDTO) {
		const user = await userDal.getByEmail(email)

		if (!user) throw new UnauthorizedError('Invalid username or password')

		if (!user.passwordHash) {
			throw new UnauthorizedError(
				'Sign in with Google, or reset your password to use your email address for login.',
			)
		}

		const passwordMatch = await comparePasswordHash({
			password,
			passwordHash: user.passwordHash,
		})
		if (!passwordMatch) {
			throw new UnauthorizedError('Invalid username or password')
		}

		if (!user.isVerified) {
			throw new ForbiddenError(
				'Email not verified. Please check your email for a verification link, or register again.',
			)
		}

		return user
	}

	async function resetPassword({ token, email, password }: ResetPasswordDTO) {
		const invalidTokenMessage =
			'Invalid or expired password reset link. Please request a new one.'

		const [resetToken, user] = await Promise.all([
			verificationTokenDal.getById(token),
			userDal.getByEmail(email),
		])

		if (
			!resetToken ||
			resetToken.expiresAt < new Date() ||
			!user ||
			user.email !== email ||
			resetToken.type !== 'password_reset'
		) {
			throw new UnauthorizedError(invalidTokenMessage)
		}

		const passwordHash = await hashPassword(password)

		await db.transaction(async (tx) => {
			await Promise.all([
				userDal.update(user.id, { passwordHash }, tx),
				verificationTokenDal.delete(token, tx),
			])
		})
	}

	async function changePassword({ currentPassword, newPassword, userId }: ChangePasswordDTO) {
		const user = await userDal.getById(userId)
		if (!user) throw new NotFoundError('User not found')

		if (!user.passwordHash) {
			throw new BadRequestError(
				'Cannot change password for Google sign-in users. Please contact support.',
			)
		}

		const passwordMatch = await comparePasswordHash({
			password: currentPassword,
			passwordHash: user.passwordHash,
		})
		if (!passwordMatch) {
			throw new UnauthorizedError('You did not provide the correct current password')
		}

		const passwordHash = await hashPassword(newPassword)
		await userDal.update(user.id, { passwordHash })
	}

	async function sendPasswordResetEmail(email: string) {
		const user = await userDal.getByEmail(email)
		if (!user) return

		const token = generateSecureToken()
		const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_TIME_MS)

		await verificationTokenDal.create({
			token,
			userId: user.id,
			expiresAt,
			type: 'password_reset',
		})
		const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`

		await sendEmail({
			to: email,
			subject: 'Reset Your Password',
			html: passwordResetEmailHtml(resetUrl),
		})
	}

	async function sendVerificationEmail({ userId, email }: SendVerificationEmailDTO) {
		const token = generateSecureToken()
		const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_TIME_MS)

		await verificationTokenDal.create({
			token,
			userId,
			expiresAt,
			type: 'email_verification',
		})
		const verificationUrl = `${env.FRONTEND_URL}/verify-user?token=${token}&email=${email}`

		await sendEmail({
			to: email,
			subject: 'Verify Your Email Address',
			html: verificationEmailHtml(verificationUrl),
		})
	}

	async function verifyUser({ token, email }: VerifyUserDTO): Promise<VerifyUserResultDTO> {
		const [user, verificationToken] = await Promise.all([
			userDal.getByEmail(email),
			verificationTokenDal.getById(token),
		])

		if (user?.isVerified) return { status: 'already_verified' }

		if (!verificationToken || verificationToken.type !== 'email_verification') {
			throw new UnauthorizedError(
				"Unable to verify email. If you haven't already verified your account, try to register again.",
			)
		}

		// Delete token, let caller know token is expired -> send new one
		if (verificationToken.expiresAt < new Date()) {
			await verificationTokenDal.delete(token)

			return {
				status: 'expired',
				userId: verificationToken.userId,
				email,
			}
		}

		// Token is valid, update user to verified and remove from DB
		await db.transaction(async (tx) => {
			await Promise.all([
				userDal.update(verificationToken.userId, { isVerified: true }, tx),
				verificationTokenDal.delete(token, tx),
			])
		})

		return { status: 'verified' }
	}

	async function authWithGoogle(googleToken: string) {
		const { googleId, email, name } = await getGoogleUserInfo(googleToken)

		const [userByGoogleId, userByEmail] = await Promise.all([
			userDal.getByGoogleId(googleId),
			userDal.getByEmail(email),
		])

		if (userByGoogleId) return userByGoogleId

		// No user with google ID -> If user exists with email, link google account to it
		if (userByEmail) return await userDal.update(userByEmail.id, { googleId, isVerified: true })

		// User does not exist with email or google -> create new user with google ID and email
		return await userDal.create({ email, name, googleId, isVerified: true })
	}

	return {
		validateCredentials,
		resetPassword,
		changePassword,
		verifyUser,
		sendPasswordResetEmail,
		sendVerificationEmail,
		authWithGoogle,
	}
}

export const authService = getAuthService({ userDal, verificationTokenDal })
