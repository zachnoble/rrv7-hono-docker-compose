import { createContext, type MiddlewareFunction, type RouterContextProvider } from 'react-router'
import { createAPIClient } from '../api/client'
import { config } from '../config.server'
import type { Client } from './types'

type APIClientContext = {
	client: Client
}

export const apiClientContext = createContext<APIClientContext | null>(null)

export function apiClientMiddleware(): MiddlewareFunction {
	return async ({ context, request }, next) => {
		const client = createAPIClient(config.API_URL, request)
		context.set(apiClientContext, { client })
		return await next()
	}
}

export function client(context: Readonly<RouterContextProvider>) {
	const client = context.get(apiClientContext)?.client
	if (!client) throw new Error('Client called outside of API Client Context')
	return client
}
