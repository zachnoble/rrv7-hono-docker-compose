import { randomUUIDv7 } from 'bun'
import { Hono } from 'hono'
import { db } from '~/db'
import { emailClientFactory } from '~/lib/email-client'
import { logger } from '~/lib/logger'
import { authServiceFactory } from '~/services/auth/auth-service'
import { healthServiceFactory } from '~/services/health/health-service'
import { sessionDalFactory } from '~/services/session/session-dal'
import { sessionServiceFactory } from '~/services/session/session-service'
import { userDalFactory } from '~/services/user/user-dal'
import { userServiceFactory } from '~/services/user/user-service'
import { verificationTokenDalFactory } from '~/services/verification-token/verification-token-dal'
import { valkey } from '~/valkey'
import { cors, errorHandler, loggerMiddleware } from './middleware'
import { authRoutes } from './routes/auth-routes'
import { healthRoutes } from './routes/health-routes'

declare module 'hono' {
	interface ContextVariableMap {
		services: typeof services
		logger: typeof logger
	}
}

/* Clients */
const emailClient = emailClientFactory()

/* DALs */
const userDal = userDalFactory(db)
const sessionDal = sessionDalFactory(db, valkey)
const verificationTokenDal = verificationTokenDalFactory(db)

/* Services */
const health = healthServiceFactory()
const user = userServiceFactory({ userDal })
const auth = authServiceFactory({ userDal, verificationTokenDal, emailClient })
const session = sessionServiceFactory({ sessionDal })

const services = {
	health,
	user,
	auth,
	session,
}

export const app = new Hono()
	.use('*', async (c, next) => {
		// Inject request scoped logger
		c.set('logger', logger.child({ requestId: randomUUIDv7() }))

		// Inject services
		c.set('services', services)

		await next()
	})
	.use(loggerMiddleware)
	.use(cors)
	.onError(errorHandler)
	.route('/', healthRoutes)
	.route('/auth', authRoutes)
