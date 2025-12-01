import { sql } from 'drizzle-orm'
import { db } from '~/db'
import { valkey } from '~/valkey'

export function healthServiceFactory() {
	async function getHealth() {
		const timestamp = new Date().toISOString()

		const [pg, vlky] = await Promise.allSettled([db.execute(sql`SELECT 1`), valkey.ping()])

		const errors = []

		if (pg.status === 'rejected') errors.push('Postgres')
		if (vlky.status === 'rejected') errors.push('Valkey')

		return {
			status: errors.length ? 500 : 200,
			message: errors.length
				? `Unable to connect to: ${errors.join(', ')}`
				: 'Service running. Postgres and Valkey are reachable.',
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
