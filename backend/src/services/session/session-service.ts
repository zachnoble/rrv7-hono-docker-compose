import type { Context } from 'hono'
import { UnauthorizedError } from '~/lib/errors'
import { generateSecureToken } from '~/lib/tokens'
import { type SessionDal, sessionDal } from './session-dal'
import { deleteSessionCookie, getSessionIdFromCookie, setSessionCookie } from './session-fns'
import type { CreateSessionDTO } from './session-types'

type Props = {
	sessionDal: SessionDal
}

export function getSessionService({ sessionDal }: Props) {
	async function getUserSession(sessionId: string) {
		const cachedUser = await sessionDal.getUserBySessionIdFromCache(sessionId)
		if (cachedUser) return cachedUser

		const dbUser = await sessionDal.getUserBySessionId(sessionId)
		if (!dbUser) throw new UnauthorizedError('Session not found')

		await sessionDal.setUserSessionCache(sessionId, dbUser)

		return dbUser
	}

	async function createSession({ userId, c }: CreateSessionDTO) {
		const sessionId = generateSecureToken()

		const session = await sessionDal.create({ userId, sessionId })

		if (c) await setSessionCookie(c, sessionId)

		return session
	}

	async function clearSession(c: Context) {
		const sessionId = await getSessionIdFromCookie(c)
		if (!sessionId) return

		deleteSessionCookie(c)

		await Promise.all([sessionDal.delete(sessionId), sessionDal.clearSessionCache(sessionId)])
	}

	return {
		getUserSession,
		createSession,
		clearSession,
	}
}

export const sessionService = getSessionService({ sessionDal })
