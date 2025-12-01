import devServer, { defaultOptions } from '@hono/vite-dev-server'
import { bunAdapter } from '@hono/vite-dev-server/bun'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
	const port = process.env.PORT

	return {
		plugins: [
			reactRouter(),
			tsconfigPaths(),
			tailwindcss(),
			devServer({
				adapter: bunAdapter,
				entry: 'server/dev.ts',
				exclude: [...defaultOptions.exclude, '/app/**'],
				injectClientScript: false,
			}),
		],
		server: {
			host: '0.0.0.0',
			port: port ? Number(port) : 5173,
		},
	}
})
