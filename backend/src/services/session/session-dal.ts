import { and, eq, gt } from 'drizzle-orm'
import type { DB } from '~/db'
import { sessions, users } from '~/db/models'
import { ormify } from '~/lib/ormify'
import { type Valkey, valKeys } from '~/valkey'
import { SESSION_CACHE_TTL_S, SESSION_EXPIRATION_TIME_S } from './session-fns'
import type { UserSessionDTO } from './session-types'

export function sessionDalFactory(db: DB, valkey: Valkey) {
	const base = ormify(db, sessions, 'sessionId')

	async function getUserBySessionId(sessionId: string) {
		return (
			await db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					expiresAt: sessions.expiresAt,
				})
				.from(sessions)
				.innerJoin(users, eq(users.id, sessions.userId))
				.where(and(eq(sessions.sessionId, sessionId), gt(sessions.expiresAt, new Date())))
				.limit(1)
		).at(0)
	}

	async function getUserBySessionIdFromCache(sessionId: string) {
		const key = valKeys.session(sessionId)

		const cachedUser = await valkey.hgetall(key)
		if (Object.keys(cachedUser).length !== 0) {
			return cachedUser as UserSessionDTO
		}

		return undefined
	}

	async function setUserSessionCache(sessionId: string, user: UserSessionDTO) {
		const key = valKeys.session(sessionId)

		await valkey
			.multi()
			.hmset(key, {
				id: user.id,
				email: user.email,
				name: user.name,
			})
			.expire(key, SESSION_CACHE_TTL_S)
			.exec()
	}

	async function extendUserSession(sessionId: string) {
		await db
			.update(sessions)
			.set({ expiresAt: new Date(Date.now() + SESSION_EXPIRATION_TIME_S * 1000) })
			.where(eq(sessions.sessionId, sessionId))
	}

	async function clearSessionCache(sessionId: string) {
		const key = valKeys.session(sessionId)

		await valkey.del(key)
	}

	return {
		...base,
		getUserBySessionId,
		getUserBySessionIdFromCache,
		setUserSessionCache,
		extendUserSession,
		clearSessionCache,
	}
}

export type SessionDal = ReturnType<typeof sessionDalFactory>
