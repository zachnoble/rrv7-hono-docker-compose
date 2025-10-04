import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError } from '~/lib/errors'
import { success } from '~/lib/responses'
import { authService } from '~/services/auth/auth-service'
import { sessionService } from '~/services/session/session-service'
import { userService } from '~/services/user/user-service'
import { authenticate, recaptcha, validate } from '../middleware'

export const authRoutes = new Hono()
	.post(
		'/login',
		recaptcha,
		validate(
			'json',
			z.object({
				email: z.string().email(),
				password: z.string().min(1),
			}),
		),
		async (c) => {
			const body = c.req.valid('json')

			const user = await authService.validateCredentials(body)

			await sessionService.createSession({
				userId: user.id,
				c,
			})

			return success(c)
		},
	)
	.post(
		'/google',
		validate(
			'json',
			z.object({
				googleToken: z.string().min(1),
			}),
		),
		async (c) => {
			const { googleToken } = c.req.valid('json')

			const user = await authService.authWithGoogle(googleToken)

			await sessionService.createSession({
				userId: user.id,
				c,
			})

			return success(c)
		},
	)
	.post(
		'/register',
		recaptcha,
		validate(
			'json',
			z.object({
				email: z.string().email(),
				password: z.string().min(10),
				name: z.string().min(2),
			}),
		),
		async (c) => {
			const body = c.req.valid('json')

			const user = await userService.createUser(body)

			await authService.sendVerificationEmail({
				email: user.email,
				userId: user.id,
			})

			return success(c)
		},
	)
	.post(
		'/verify-user',
		validate(
			'json',
			z.object({
				email: z.string().email(),
				token: z.string().min(1),
			}),
		),
		async (c) => {
			const body = c.req.valid('json')

			const result = await authService.verifyUser(body)

			// If token is expired, send new email + throw exception to let user know
			if (result.status === 'expired') {
				await authService.sendVerificationEmail({
					userId: result.userId,
					email: result.email,
				})

				throw new BadRequestError(
					'Verification email expired. We sent a new one to your email address!',
				)
			}

			return success(c)
		},
	)
	.post(
		'/forgot-password',
		recaptcha,
		validate(
			'json',
			z.object({
				email: z.string().email(),
			}),
		),
		async (c) => {
			const { email } = c.req.valid('json')

			await authService.sendPasswordResetEmail(email)

			return success(c)
		},
	)
	.post(
		'/reset-password',
		validate(
			'json',
			z.object({
				email: z.string().email(),
				password: z.string().min(10),
				token: z.string().min(1),
			}),
		),
		async (c) => {
			const body = c.req.valid('json')

			await authService.resetPassword(body)

			return success(c)
		},
	)
	.post(
		'/change-password',
		authenticate,
		recaptcha,
		validate(
			'json',
			z.object({
				newPassword: z.string().min(10),
				currentPassword: z.string().min(1),
			}),
		),
		async (c) => {
			const body = c.req.valid('json')
			const user = c.get('user')

			await authService.changePassword({ ...body, userId: user.id })

			return success(c)
		},
	)
	.post('/logout', async (c) => {
		await sessionService.clearSession(c)

		return success(c)
	})
	.get('/user', authenticate, (c) => c.json(c.get('user')))
