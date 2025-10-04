import { createMiddleware } from 'hono/factory'
import { UnauthorizedError } from '~/lib/errors'
import { getSessionIdFromCookie } from '~/services/session/session-fns'
import { sessionService } from '~/services/session/session-service'
import type { UserSessionDTO } from '~/services/session/session-types'

type Context = {
	Variables: {
		user: UserSessionDTO
	}
}

export const authenticate = createMiddleware<Context>(async (c, next) => {
	const sessionId = await getSessionIdFromCookie(c)
	if (!sessionId) throw new UnauthorizedError('Session ID missing in request')

	c.set('user', await sessionService.getUserSession(sessionId))

	await next()
})
