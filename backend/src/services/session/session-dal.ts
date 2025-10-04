import { eq } from 'drizzle-orm'
import { type DB, db } from '~/db'
import { sessions, users } from '~/db/models'
import { ormify } from '~/lib/ormify'
import { valkey } from '~/valkey'
import { valKeys } from '~/valkey/keys'
import { SESSION_CACHE_TTL_S } from './session-fns'
import type { UserSessionDTO } from './session-types'

export function getSessionDal(db: DB) {
	const base = ormify(db, sessions, 'sessionId')

	async function getUserBySessionId(sessionId: string) {
		return (
			await db
				.select({ id: users.id, name: users.name, email: users.email })
				.from(sessions)
				.innerJoin(users, eq(users.id, sessions.userId))
				.where(eq(sessions.sessionId, sessionId))
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
			.pipeline()
			.hmset(key, {
				id: user.id,
				email: user.email,
				name: user.name,
			})
			.expire(key, SESSION_CACHE_TTL_S)
			.exec()
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
		clearSessionCache,
	}
}

export const sessionDal = getSessionDal(db)

export type SessionDal = typeof sessionDal
