import { db } from '~/db'
import { ConflictError } from '~/lib/errors'
import { hashPassword } from '../auth/auth-fns'
import { type UserDal, userDal } from './user-dal'
import type { CreateUserDTO } from './user-types'

type Props = {
	userDal: UserDal
}

export function getUserService({ userDal }: Props) {
	async function createUser({
		email,
		name,
		password,
		isVerified = false,
		googleId,
	}: CreateUserDTO) {
		const existingUser = await userDal.getByEmail(email)
		if (existingUser?.isVerified) {
			throw new ConflictError('Sorry, that email address is already taken.')
		}

		const passwordHash = password ? await hashPassword(password) : null

		const user = await db.transaction(async (tx) => {
			// If user exists and is not verified, delete the user
			if (existingUser && !existingUser.isVerified) {
				await userDal.delete(existingUser.id, tx)
			}

			const user = await userDal.create(
				{ email, name, passwordHash, isVerified, googleId },
				tx,
			)

			return user
		})

		return user
	}

	return {
		createUser,
	}
}

export const userService = getUserService({ userDal })
