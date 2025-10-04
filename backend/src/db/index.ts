import type { ExtractTablesWithRelations } from 'drizzle-orm'
import { type NodePgQueryResultHKT, drizzle } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import { env } from '~/lib/env'

const pool = new Pool({
	user: env.DB_USER,
	password: env.DB_PASSWORD,
	host: env.DB_HOST,
	port: env.DB_PORT,
	database: env.DB_NAME,
})

export const db = drizzle(pool)

export type DB = typeof db

export type Transaction = PgTransaction<
	NodePgQueryResultHKT,
	Record<string, never>,
	ExtractTablesWithRelations<Record<string, never>>
>
