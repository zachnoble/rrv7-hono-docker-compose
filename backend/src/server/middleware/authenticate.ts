import { createMiddleware } from 'hono/factory'
import { UnauthorizedError } from '~/lib/errors'
import { getSessionIdFromCookie } from '~/services/session/session-fns'
import type { UserSessionDTO } from '~/services/session/session-types'

type Context = {
	Variables: {
		user: UserSessionDTO
	}
}

export const authenticate = createMiddleware<Context>(async (c, next) => {
	const sessionId = await getSessionIdFromCookie(c)
	if (!sessionId) throw new UnauthorizedError('Session ID missing in request')

	const services = c.get('services')

	const user = await services.session.getUserSession(sessionId)
	c.set('user', user)

	await next()
})
