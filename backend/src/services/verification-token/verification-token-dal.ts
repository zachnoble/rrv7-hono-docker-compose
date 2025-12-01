import type { DB } from '~/db'
import { verificationTokens } from '~/db/models'
import { ormify } from '~/lib/ormify'

export function verificationTokenDalFactory(db: DB) {
	const base = ormify(db, verificationTokens, 'token')

	return {
		...base,
	}
}

export type VerificationTokenDal = ReturnType<typeof verificationTokenDalFactory>
