import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { createMiddleware } from 'hono/factory'
import { logger } from 'hono/logger'
import { createRequestHandler } from 'react-router'

const app = new Hono({ strict: false })
	.use(compress())
	.use(logger())
	.use(async (c, next) => {
		return createMiddleware(async (c) => {
			return createRequestHandler(
				() => import('virtual:react-router/server-build'),
				Bun.env.NODE_ENV,
			)(c.req.raw)
		})(c, next)
	})

const port = Bun.env.PORT ? Number(Bun.env.PORT) : 5174

export default {
	port,
	fetch: app.fetch,
} satisfies Bun.Serve.Options<string, string>
