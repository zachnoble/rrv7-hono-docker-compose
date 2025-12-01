import { db } from '~/db'
import { config } from '~/lib/config'
import type { EmailClient } from '~/lib/email-client'
import { ForbiddenError, NotFoundError, UnauthorizedError } from '~/lib/errors'
import { generateSecureToken } from '~/lib/tokens'
import type { UserDal } from '../user/user-dal'
import type { VerificationTokenDal } from '../verification-token/verification-token-dal'
import {
	comparePasswordHash,
	generateResetPasswordEmail,
	generateVerificationEmail,
	getGoogleUserInfo,
	hashPassword,
	TOKEN_EXPIRATION_TIME_MS,
} from './auth-fns'
import type {
	ChangePasswordDTO,
	LoginDTO,
	ResetPasswordDTO,
	SendVerificationEmailDTO,
	VerifyUserDTO,
	VerifyUserResultDTO,
} from './auth-types'

type Dependencies = {
	userDal: UserDal
	verificationTokenDal: VerificationTokenDal
	emailClient: EmailClient
}

export function authServiceFactory({ userDal, verificationTokenDal, emailClient }: Dependencies) {
	async function authWithGoogle(googleToken: string) {
		const { googleId, email, name } = await getGoogleUserInfo(googleToken)

		return (
			(await userDal.getByGoogleId(googleId)) ??
			(await userDal.upsert('email', { email, name, googleId, isVerified: true }))
		)
	}

	async function validateCredentials({ email, password }: LoginDTO) {
		const user = await userDal.getByEmail(email)
		if (!user) throw new UnauthorizedError('Invalid username or password')
		if (!user.passwordHash) {
			throw new UnauthorizedError(
				'Sign in with Google, or reset your password to use your email address for login.',
			)
		}
		if (!user.isVerified) {
			throw new ForbiddenError(
				'Email not verified. Please check your email for a verification link, or register again.',
			)
		}

		const passwordMatch = await comparePasswordHash({
			password,
			passwordHash: user.passwordHash,
		})
		if (!passwordMatch) {
			throw new UnauthorizedError('Invalid username or password')
		}

		return user
	}

	async function resetPassword({ token, email, password }: ResetPasswordDTO) {
		const [resetToken, user] = await Promise.all([
			verificationTokenDal.get(token),
			userDal.getByEmail(email),
		])

		const resetTokenIsValid =
			resetToken && resetToken.expiresAt > new Date() && resetToken.type === 'password_reset'

		const emailIsValid = user && user.email === email

		if (!resetTokenIsValid || !emailIsValid) {
			throw new UnauthorizedError(
				'Invalid or expired password reset link. Please request a new one.',
			)
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
		const user = await userDal.get(userId)
		if (!user) throw new NotFoundError('User not found')

		if (user.passwordHash) {
			const passwordMatch = await comparePasswordHash({
				password: currentPassword,
				passwordHash: user.passwordHash,
			})
			if (!passwordMatch) {
				throw new UnauthorizedError('You did not provide the correct current password')
			}
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

		const subject = 'Reset Your Password'
		const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}&email=${email}`
		const html = generateResetPasswordEmail(resetUrl)

		await emailClient.sendEmail({
			to: email,
			subject,
			html,
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

		const subject = 'Verify Your Email Address'
		const verificationUrl = `${config.FRONTEND_URL}/verify-user?token=${token}&email=${email}`
		const html = generateVerificationEmail(verificationUrl)

		await emailClient.sendEmail({
			to: email,
			subject,
			html,
		})
	}

	async function verifyUser({ token, email }: VerifyUserDTO): Promise<VerifyUserResultDTO> {
		const [user, verificationToken] = await Promise.all([
			userDal.getByEmail(email),
			verificationTokenDal.get(token),
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
