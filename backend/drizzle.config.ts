import { defineConfig } from 'drizzle-kit'
import { config } from '~/lib/config'

export default defineConfig({
	out: './src/db/migrations',
	schema: './src/db/models',
	dialect: 'postgresql',
	dbCredentials: {
		user: config.DB_USER,
		password: config.DB_PASSWORD,
		host: config.DB_HOST,
		port: config.DB_PORT,
		database: config.DB_NAME,
		ssl: false,
	},
})
