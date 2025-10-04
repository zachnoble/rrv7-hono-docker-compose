import { z } from 'zod'
import { authSchemas } from '~/features/auth/schemas'

export const resetPasswordSchema = z.object({
	email: authSchemas.email,
	password: authSchemas.password,
	token: authSchemas.token,
})

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
