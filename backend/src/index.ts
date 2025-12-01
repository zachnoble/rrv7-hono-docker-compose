import { config } from './lib/config'
import { app } from './server'

export default {
	port: config.PORT,
	fetch: app.fetch,
} satisfies Bun.Serve.Options<string, string>
