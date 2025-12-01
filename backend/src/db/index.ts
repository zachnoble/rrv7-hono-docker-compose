import { Connector } from '@google-cloud/cloud-sql-connector'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import { config } from '~/lib/config'

async function createPool() {
	// Connect to Cloud SQL over Unix socket
	if (config.USE_UNIX_CONNECTION && config.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
		const connector = new Connector()
		await connector.startLocalProxy({
			instanceConnectionName: config.CLOUD_SQL_INSTANCE_CONNECTION_NAME,
			listenOptions: { path: '.s.PGSQL.5432' },
		})
		const hostPath = process.cwd()
		return new Pool({
			user: config.DB_USER,
			password: config.DB_PASSWORD,
			database: config.DB_NAME,
			host: hostPath,
		})
	}

	// Standard connection
	return new Pool({
		user: config.DB_USER,
		password: config.DB_PASSWORD,
		host: config.DB_HOST,
		port: config.DB_PORT,
		database: config.DB_NAME,
	})
}

export const pool = await createPool()

export const db = drizzle(pool)

export type DB = typeof db

export type Transaction = PgTransaction<
	NodePgQueryResultHKT,
	Record<string, never>,
	ExtractTablesWithRelations<Record<string, never>>
>
