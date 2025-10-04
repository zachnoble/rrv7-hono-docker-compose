export type CreateUserDTO = {
	email: string
	name: string
	isVerified?: boolean
} & ({ password: string; googleId?: string } | { googleId: string; password?: string })
