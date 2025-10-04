import { z } from 'zod'
import { authSchemas } from '~/features/auth/schemas'

export const loginSchema = z.object({
	email: authSchemas.email,
	password: authSchemas.existingPassword,
	recaptchaToken: authSchemas.recaptchaToken,
})

export type LoginSchema = z.infer<typeof loginSchema>
