import { db } from '~/db'
import { ConflictError } from '~/lib/errors'
import { hashPassword } from '../auth/auth-fns'
import type { UserDal } from './user-dal'
import type { CreateUserDTO } from './user-types'

type Dependencies = {
	userDal: UserDal
}

export function userServiceFactory({ userDal }: Dependencies) {
	async function createUser({
		email,
		name,
		password,
		googleId,
		isVerified = false,
	}: CreateUserDTO) {
		const existingUser = await userDal.getByEmail(email)
		if (existingUser?.isVerified) {
			throw new ConflictError('Sorry, that email address is already taken.')
		}

		const passwordHash = password ? await hashPassword(password) : null

		return await db.transaction(async (tx) => {
			// If user exists and is not verified, delete the user
			if (existingUser && !existingUser.isVerified) {
				await userDal.delete(existingUser.id, tx)
			}

			return await userDal.create({ email, name, passwordHash, isVerified, googleId }, tx)
		})
	}

	return {
		createUser,
	}
}
