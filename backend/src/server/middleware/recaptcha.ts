import { createMiddleware } from 'hono/factory'
import { z } from 'zod'
import { env } from '~/lib/env'
import { BadRequestError } from '~/lib/errors'
import { logger } from '~/lib/logger'

const recaptchaApiUrl =
	'https://recaptchaenterprise.googleapis.com/v1/projects/bun-recaptcha-test/assessments'

const recaptchaResponseSchema = z.object({
	tokenProperties: z.object({
		valid: z.boolean(),
		hostname: z.string(),
		action: z.string().optional(),
		createTime: z.string(),
	}),
	riskAnalysis: z.object({
		score: z.number(),
		reasons: z.array(z.string()).optional(),
	}),
})

const message = 'Suspicious activity detected. Please try again.'

// Risk threshold for recaptcha to pass
// 0.0 = most risky, 1.0 = least risky
const riskThreshold = 0.5

export const recaptcha = createMiddleware(async (c, next) => {
	if (env.NODE_ENV !== 'production') return next()

	const body = await c.req.json()
	const token = body.recaptchaToken

	const url = `${recaptchaApiUrl}?key=${env.GCP_RECAPTCHA_API_KEY}`

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			event: {
				token,
				siteKey: env.GCP_RECAPTCHA_SITE_KEY,
			},
		}),
	})

	if (!response.ok) {
		logger.error('Request to recaptcha API failed', {
			response,
		})
		throw new BadRequestError(message)
	}

	const data = await response.json()
	const validatedData = recaptchaResponseSchema.parse(data)

	const isValid = validatedData.tokenProperties.valid
	const score = validatedData.riskAnalysis.score
	const pass = isValid && score >= riskThreshold

	if (!pass) {
		logger.error('Recaptcha verification failed', {
			response,
		})
		throw new BadRequestError(message)
	}

	return next()
})
