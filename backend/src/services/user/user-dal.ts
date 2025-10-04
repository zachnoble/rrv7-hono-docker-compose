import { eq } from 'drizzle-orm'
import { type DB, db } from '~/db'
import { users } from '~/db/models'
import { ormify } from '~/lib/ormify'

export function getUserDal(db: DB) {
	const base = ormify(db, users)

	async function getByEmail(email: string) {
		return (await db.select().from(users).where(eq(users.email, email)).limit(1)).at(0)
	}

	async function getByGoogleId(googleId: string) {
		return (await db.select().from(users).where(eq(users.googleId, googleId)).limit(1)).at(0)
	}

	return {
		...base,
		getByEmail,
		getByGoogleId,
	}
}

export const userDal = getUserDal(db)

export type UserDal = typeof userDal
