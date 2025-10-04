import { Hono } from 'hono'
import { healthService } from '~/services/health/health-service'

export const healthRoutes = new Hono()
	.get('/readiness', (c) => {
		const readiness = healthService.getReadiness()
		return c.json(readiness)
	})
	.get('/health', async (c) => {
		const health = await healthService.getHealth()
		return c.json(health, health.status)
	})
