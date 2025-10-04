import { cors as honoCors } from 'hono/cors'
import { env } from '~/lib/env'

export const cors = honoCors({
	origin: env.FRONTEND_URL,
	allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	credentials: true,
})
