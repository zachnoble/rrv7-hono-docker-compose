import path from 'node:path'
import url from 'node:url'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { compress } from 'hono/compress'
import { createMiddleware } from 'hono/factory'
import { logger } from 'hono/logger'
import { createRequestHandler, type ServerBuild } from 'react-router'
import { cache } from './middleware/cache'

const buildPath = path.resolve('./build/server')
const build: ServerBuild = await import(url.pathToFileURL(buildPath).href)

const app = new Hono({ strict: false })
	.use(compress())
	.use(logger())
	.use(
		`${path.posix.join(build.publicPath, 'assets')}/*`,
		cache(60 * 60 * 24 * 365),
		serveStatic({
			root: path.join(build.assetsBuildDirectory, 'assets'),
		}),
	)
	.use(
		'*',
		cache(60 * 60),
		serveStatic({
			root: build.assetsBuildDirectory,
		}),
	)
	.use(async (c, next) => {
		return createMiddleware(async (c) => {
			return createRequestHandler(build, Bun.env.NODE_ENV)(c.req.raw)
		})(c, next)
	})

const port = Bun.env.PORT ? Number(Bun.env.PORT) : 8080

export default {
	port,
	fetch: app.fetch,
} satisfies Bun.Serve.Options<string, string>
