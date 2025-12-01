// Bun doesn't fully support 'react-dom/server.browser'; re-export from 'react-dom/server'

declare module 'react-dom/server.browser' {
	export { renderToReadableStream } from 'react-dom/server'
}
