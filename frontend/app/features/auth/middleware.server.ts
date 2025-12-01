import {
	createContext,
	type MiddlewareFunction,
	type RouterContextProvider,
	replace,
} from 'react-router'
import { client } from '~/lib/api/middleware.server'
import type { User } from './types'

type AuthContext = {
	user: User | null
}

const authContext = createContext<AuthContext | null>(null)

export function authMiddleware(): MiddlewareFunction {
	return async ({ context, request }, next) => {
		const cookie = request.headers?.get('Cookie')
		const hasSessionId = Boolean(cookie?.match(/sessionId=([^;]+)/))

		if (hasSessionId) {
			try {
				const api = client(context)
				const { data: user } = await api.get<User>('/auth/user')
				context.set(authContext, { user })
			} catch {
				context.set(authContext, null)
			}
		} else {
			context.set(authContext, null)
		}

		return await next()
	}
}

export function getUser(context: Readonly<RouterContextProvider>) {
	return context.get(authContext)?.user ?? null
}

export function requireAuth(context: Readonly<RouterContextProvider>) {
	const user = getUser(context)
	if (!user) throw replace('/login')
	return user
}

export function requireGuest(context: Readonly<RouterContextProvider>) {
	const user = getUser(context)
	if (user) throw replace('/')
	return null
}
