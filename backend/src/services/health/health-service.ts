import { sql } from 'drizzle-orm'
import { db } from '~/db'
import { logger } from '~/lib/logger'
import { valkey } from '~/valkey'

export function getHealthService() {
	async function getHealth() {
		const timestamp = new Date().toISOString()
		const errors = []

		const [pgCheck, valkeyCheck] = await Promise.allSettled([
			db.execute(sql`SELECT 1`),
			valkey.ping(),
		])

		if (pgCheck.status === 'rejected') {
			logger.error(pgCheck.reason)
			errors.push('Postgres')
		}

		if (valkeyCheck.status === 'rejected') {
			logger.error(valkeyCheck.reason)
			errors.push('Valkey')
		}

		if (errors.length > 0) {
			return {
				status: 500 as const,
				message: `Unable to connect to: ${errors.join(', ')}`,
				timestamp,
			}
		}

		return {
			status: 200 as const,
			message: 'Service running. Postgres and Valkey are reachable.',
			timestamp,
		}
	}

	function getReadiness() {
		const timestamp = new Date().toISOString()

		return {
			message: 'Service running.',
			timestamp,
		}
	}

	return { getHealth, getReadiness }
}

export const healthService = getHealthService()
