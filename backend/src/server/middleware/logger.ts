import { createMiddleware } from 'hono/factory'
import { getPath } from 'hono/utils/url'

export const loggerMiddleware = createMiddleware(async (c, next) => {
	const logger = c.get('logger')

	const path = getPath(c.req.raw)
	const method = c.req.method

	logger.info({ method, path }, 'Incoming request')

	const start = performance.now()

	await next()

	const duration = performance.now() - start

	logger.info(
		{
			method,
			path,
			status: c.res.status,
			duration: `${duration.toFixed(2)}ms`,
		},
		'Request completed',
	)
})
