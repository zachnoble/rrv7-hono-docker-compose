import { type DB, db } from '~/db'
import { verificationTokens } from '~/db/models'
import { ormify } from '~/lib/ormify'

export function getVerificationTokenDal(db: DB) {
	const base = ormify(db, verificationTokens, 'token')

	return {
		...base,
	}
}

export const verificationTokenDal = getVerificationTokenDal(db)

export type VerificationTokenDal = typeof verificationTokenDal
