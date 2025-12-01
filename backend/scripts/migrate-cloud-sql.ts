import path from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { pool } from '~/db'
import { logger } from '~/lib/logger'

try {
	// Connect to the pool
	const client = await pool.connect()
	logger.info('Connected to database')
	client.release()

	// Create drizzle instance
	const db = drizzle(pool)

	// Run migrations
	logger.info('Running migrations..')
	const migrationsFolder = path.join(import.meta.dirname, '../src/db/migrations')
	await migrate(db, { migrationsFolder })

	// Success
	logger.info('Completed migrations')
} catch (error) {
	// Error
	logger.error(`Migrations failed: ${error}`)
	process.exit(1)
} finally {
	// Finished; close the pool
	await pool.end()
	logger.info('Database connection closed')
}
