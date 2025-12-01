import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const healthRoutes = new Hono()
	.get('/readiness', (c) => {
		const services = c.get('services')

		const readiness = services.health.getReadiness()

		return c.json(readiness)
	})
	.get('/health', async (c) => {
		const services = c.get('services')

		const health = await services.health.getHealth()

		return c.json(health, health.status as ContentfulStatusCode)
	})
