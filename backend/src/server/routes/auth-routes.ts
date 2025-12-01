import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError } from '~/lib/errors'
import { success } from '~/lib/responses'
import {
	deleteSessionCookie,
	getSessionIdFromCookie,
	setSessionCookie,
} from '~/services/session/session-fns'
import { authenticate, recaptcha, validate } from '../middleware'

export const authRoutes = new Hono()
	.post(
		'/login',
		recaptcha,
		validate(
			'json',
			z.object({
				email: z.email(),
				password: z.string().min(1),
			}),
		),
		async (c) => {
			const services = c.get('services')
			const body = c.req.valid('json')

			const user = await services.auth.validateCredentials(body)

			const { sessionId } = await services.session.createSession(user.id)
			await setSessionCookie(c, sessionId)

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
			const services = c.get('services')
			const body = c.req.valid('json')

			const user = await services.auth.authWithGoogle(body.googleToken)

			const { sessionId } = await services.session.createSession(user.id)
			await setSessionCookie(c, sessionId)

			return success(c)
		},
	)
	.post(
		'/register',
		recaptcha,
		validate(
			'json',
			z.object({
				email: z.email(),
				password: z.string().min(10),
				name: z.string().min(2),
			}),
		),
		async (c) => {
			const services = c.get('services')
			const body = c.req.valid('json')

			const user = await services.user.createUser(body)

			await services.auth.sendVerificationEmail({
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
				email: z.email(),
				token: z.string().min(1),
			}),
		),
		async (c) => {
			const services = c.get('services')
			const body = c.req.valid('json')

			const result = await services.auth.verifyUser(body)

			if (result.status === 'expired') {
				await services.auth.sendVerificationEmail({
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
				email: z.email(),
			}),
		),
		async (c) => {
			const services = c.get('services')
			const body = c.req.valid('json')

			await services.auth.sendPasswordResetEmail(body.email)

			return success(c)
		},
	)
	.post(
		'/reset-password',
		validate(
			'json',
			z.object({
				email: z.email(),
				password: z.string().min(10),
				token: z.string().min(1),
			}),
		),
		async (c) => {
			const services = c.get('services')
			const body = c.req.valid('json')

			await services.auth.resetPassword(body)

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
			const services = c.get('services')
			const body = c.req.valid('json')
			const user = c.get('user')

			await services.auth.changePassword({ ...body, userId: user.id })

			return success(c)
		},
	)
	.post('/logout', async (c) => {
		const services = c.get('services')

		const sessionId = await getSessionIdFromCookie(c)
		await services.session.clearSession(String(sessionId))
		deleteSessionCookie(c)

		return success(c)
	})
	.get('/user', authenticate, (c) => c.json(c.get('user')))
