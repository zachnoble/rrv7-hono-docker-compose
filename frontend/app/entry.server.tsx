import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server.browser'
import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	const userAgent = request.headers.get('user-agent')
	let status = responseStatusCode
	let shellRendered = false

	const body = await renderToReadableStream(
		<ServerRouter context={routerContext} url={request.url} />,
		{
			onError(error: unknown) {
				status = 500
				if (shellRendered) {
					console.error(error)
				}
			},
		},
	)
	shellRendered = true

	if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
		await body.allReady
	}

	responseHeaders.set('Content-Type', 'text/html')
	return new Response(body, {
		headers: responseHeaders,
		status,
	})
}
