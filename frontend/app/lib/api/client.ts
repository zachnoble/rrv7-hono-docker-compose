import {
	combineHeaders,
	createURL,
	defaultHeaders,
	getDataFromResponse,
	handleResponseError,
	stringifiedBody,
} from './fns'
import type { Client, ClientResponse, RequestOptions } from './types'

async function fetcher<T>(
	baseUrl: string,
	path: string,
	method: string,
	options: RequestOptions = {},
): Promise<ClientResponse<T>> {
	const url = createURL(baseUrl, path, options.params)
	const body = stringifiedBody(options.body)
	const headers = combineHeaders(options.headers, defaultHeaders)
	const { signal } = options

	const init: RequestInit = {
		method,
		headers,
		body,
		signal,
		credentials: 'include',
	}

	const response = await fetch(url, init)

	await handleResponseError(response)

	const data = await getDataFromResponse<T>(response)

	return { data, response }
}

function createBodyMethod(baseUrl: string, method: string, headers?: Headers) {
	return <T>(
		path: string,
		body?: unknown,
		options?: RequestOptions,
	): Promise<ClientResponse<T>> =>
		fetcher<T>(baseUrl, path, method, {
			...options,
			body,
			headers: combineHeaders(headers, options?.headers),
		})
}

function createNoBodyMethod(baseUrl: string, method: string, headers?: Headers) {
	return <T>(path: string, options?: RequestOptions): Promise<ClientResponse<T>> =>
		fetcher<T>(baseUrl, path, method, {
			...options,
			headers: combineHeaders(headers, options?.headers),
		})
}

function initMethods(baseUrl: string, headers?: Headers) {
	return {
		get: createNoBodyMethod(baseUrl, 'GET', headers),
		post: createBodyMethod(baseUrl, 'POST', headers),
		put: createBodyMethod(baseUrl, 'PUT', headers),
		patch: createBodyMethod(baseUrl, 'PATCH', headers),
		delete: createNoBodyMethod(baseUrl, 'DELETE', headers),
	}
}

export function createAPIClient(baseUrl: string, request?: Request): Client {
	if (request) {
		const headers = new Headers()

		const cookie = request.headers.get('cookie')
		if (cookie) {
			headers.set('Cookie', cookie)
		}

		return initMethods(baseUrl, headers)
	}
	return initMethods(baseUrl)
}
