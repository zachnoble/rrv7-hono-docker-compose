import { z } from 'zod'

export type Env = z.infer<typeof schema>
export type Environment = Env['NODE_ENV']

const schema = z
	.object({
		NODE_ENV: z.enum(['test', 'development', 'production']),
		PORT: z.coerce.number(),
		FRONTEND_URL: z.string().min(1),

		// Signature for signing cookies
		SIGNATURE: z.string().min(1),

		// Postgres
		DB_USER: z.string().min(1),
		DB_PASSWORD: z.string().min(1),
		DB_HOST: z.string().min(1),
		DB_NAME: z.string().min(1),
		DB_PORT: z.coerce.number(),

		// Valkey
		VALKEY_HOST: z.string().min(1),
		VALKEY_PORT: z.coerce.number(),

		// GCP config
		GCP_RECAPTCHA_API_KEY: z.string().optional(),
		GCP_RECAPTCHA_SITE_KEY: z.string().optional(),

		// Email with Resend
		RESEND_API_KEY: z.string().min(1),
		EMAIL_FROM: z.string().email(),
	})
	.superRefine((data, ctx) => {
		if (data.NODE_ENV === 'production') {
			const requiredProdVariables = [
				'GCP_RECAPTCHA_API_KEY',
				'GCP_RECAPTCHA_SITE_KEY',
			] as const

			for (const variable of requiredProdVariables) {
				if (!data[variable]) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `${variable} is required in production`,
						path: [variable],
					})
				}
			}
		}
	})

// Environment-specific defaults
const environmentDefaults: Record<Environment, Partial<Env>> = {
	test: {
		PORT: 8080,
		FRONTEND_URL: 'http://localhost:5173',
		SIGNATURE: 'test-signature',
		DB_USER: 'postgres',
		DB_PASSWORD: 'postgres',
		DB_NAME: 'postgres_test',
		DB_HOST: 'localhost',
		DB_PORT: 5432,
		VALKEY_HOST: 'localhost',
		VALKEY_PORT: 6379,
		RESEND_API_KEY: 'test-key',
		EMAIL_FROM: 'test@domain.com',
	},
	development: {
		PORT: 8080,
		FRONTEND_URL: 'http://localhost:5173',
		SIGNATURE: 'development-signature',
		DB_USER: 'postgres',
		DB_PASSWORD: 'postgres',
		DB_NAME: 'postgres',
		DB_HOST: 'localhost',
		DB_PORT: 5432,
		VALKEY_HOST: 'localhost',
		VALKEY_PORT: 6379,
	},
	production: {
		PORT: 8080,
	},
}

export const env = (() => {
	const nodeEnv = Bun.env.NODE_ENV as Environment
	const defaults = environmentDefaults[nodeEnv]

	// Merge defaults with actual environment variables (env vars take precedence)
	const mergedEnv = { ...defaults, ...Bun.env }

	return schema.parse(mergedEnv)
})()
