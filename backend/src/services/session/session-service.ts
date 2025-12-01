import { UnauthorizedError } from '~/lib/errors'
import { generateSecureToken } from '~/lib/tokens'
import type { SessionDal } from './session-dal'
import { SESSION_EXPIRATION_TIME_S } from './session-fns'

type Dependencies = {
	sessionDal: SessionDal
}

export function sessionServiceFactory({ sessionDal }: Dependencies) {
	async function getUserSession(sessionId: string) {
		const cachedUser = await sessionDal.getUserBySessionIdFromCache(sessionId)
		if (cachedUser) return cachedUser

		const dbUser = await sessionDal.getUserBySessionId(sessionId)
		if (!dbUser) throw new UnauthorizedError('Session not found')

		await Promise.all([
			sessionDal.setUserSessionCache(sessionId, dbUser),
			sessionDal.extendUserSession(sessionId),
		])

		return dbUser
	}

	async function createSession(userId: string) {
		const sessionId = generateSecureToken()

		const session = await sessionDal.create({
			userId,
			sessionId,
			expiresAt: new Date(Date.now() + SESSION_EXPIRATION_TIME_S * 1000),
		})

		return session
	}

	async function clearSession(sessionId: string) {
		await Promise.all([sessionDal.delete(sessionId), sessionDal.clearSessionCache(sessionId)])
	}

	return {
		getUserSession,
		createSession,
		clearSession,
	}
}
