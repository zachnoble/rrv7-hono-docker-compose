import { cors as honoCors } from 'hono/cors'
import { config } from '~/lib/config'

export const cors = honoCors({
	origin: config.FRONTEND_URL,
	allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	credentials: true,
})
