import { afterEach, beforeAll } from 'bun:test'
import { sql } from 'drizzle-orm'
import { db } from '~/db'
import { config } from '~/lib/config'
import { valkey } from '~/valkey'
import { client } from './test-client'

function assertTestEnvironment() {
	if (config.NODE_ENV !== 'test' || !config.DB_NAME.includes('test')) {
		throw new Error('!!! Dangerous function called outside of test environment !!!')
	}
}

async function clearDatabase() {
	assertTestEnvironment()

	await Promise.all([
		db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`),
		db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`),
	])

	await db.execute(sql`CREATE SCHEMA public`)
}

async function clearValkey() {
	assertTestEnvironment()

	await valkey.flushdb()
}

async function truncateTables() {
	assertTestEnvironment()

	const { rows } = await db.execute<{ tablename: string }>(sql`
		SELECT tablename 
		FROM pg_tables 
		WHERE schemaname = 'public'
	`)
	if (rows.length === 0) return

	const tableNames = rows.map((table) => table.tablename).join(', ')
	await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`))
}

beforeAll(async () => {
	await Promise.all([clearDatabase(), clearValkey()])

	await Bun.spawn(['bun', 'run', 'migrate']).exited
})

afterEach(async () => {
	await Promise.all([
		truncateTables(),
		clearValkey(),
		client.clearAuthentication({
			// Above fns delete sessions from PG + valkey; skip deletion for a tiny perf gain
			deleteSession: false,
		}),
	])
})
