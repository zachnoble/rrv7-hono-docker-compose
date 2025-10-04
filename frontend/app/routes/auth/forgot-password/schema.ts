import { z } from 'zod'
import { authSchemas } from '~/features/auth/schemas'

export const forgotPasswordSchema = z.object({
	email: authSchemas.email,
	recaptchaToken: authSchemas.recaptchaToken,
})

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
