import { z } from 'zod'
import { authSchemas } from '~/features/auth/schemas'

export const registerSchema = z.object({
	name: authSchemas.name,
	email: authSchemas.email,
	password: authSchemas.password,
	recaptchaToken: authSchemas.recaptchaToken,
})

export type RegisterSchema = z.infer<typeof registerSchema>
