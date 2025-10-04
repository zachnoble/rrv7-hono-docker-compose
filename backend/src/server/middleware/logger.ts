import { createMiddleware } from 'hono/factory'
import { getPath } from 'hono/utils/url'
import { logger } from '~/lib/logger'

export const loggerMiddleware = createMiddleware(async (c, next) => {
	const start = performance.now()
	const path = getPath(c.req.raw)

	logger.info({ method: c.req.method, path }, 'Incoming request')

	await next()

	logger.info(
		{
			method: c.req.method,
			path,
			status: c.res.status,
			duration: `${(performance.now() - start).toFixed(2)}ms`,
		},
		'Request completed',
	)
})
