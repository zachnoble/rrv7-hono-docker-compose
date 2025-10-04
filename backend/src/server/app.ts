import { Hono } from 'hono'
import { cors, errorHandler, loggerMiddleware } from './middleware'
import { routes } from './routes'

export const app = new Hono()
	.use(cors)
	.use(loggerMiddleware)
	.onError(errorHandler)
	.route('/', routes)
