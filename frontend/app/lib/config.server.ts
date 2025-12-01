import { z } from 'zod'

export type Env = z.infer<typeof schema>
export type Environment = Env['NODE_ENV']

const schema = z.object({
	NODE_ENV: z.enum(['test', 'development', 'production']),
	PORT: z.coerce.number(),
	API_URL: z.string().min(1),

	// Signature for signing cookies
	SIGNATURE: z.string().min(1),

	// GCP config
	GCP_RECAPTCHA_SITE_KEY: z.string(),
	GCP_OAUTH_CLIENT_ID: z.string(),
})

// Environment-specific defaults
const environmentDefaults: Record<Environment, Partial<Env>> = {
	test: {
		PORT: 5173,
		API_URL: 'http://localhost:8080',
		SIGNATURE: 'test-signature',
		GCP_RECAPTCHA_SITE_KEY: '',
		GCP_OAUTH_CLIENT_ID: '',
	},
	development: {
		PORT: 5173,
		API_URL: 'http://localhost:8080',
		SIGNATURE: 'development-signature',
		GCP_RECAPTCHA_SITE_KEY: '',
		GCP_OAUTH_CLIENT_ID: '',
	},
	production: {},
}

export const config = (() => {
	const nodeEnv = Bun.env.NODE_ENV as Environment
	const defaults = environmentDefaults[nodeEnv]

	// Merge defaults with actual environment variables (env vars take precedence)
	const mergedEnv = { ...defaults, ...Bun.env }
	const parsedEnv = schema.parse(mergedEnv)

	return parsedEnv
})()
