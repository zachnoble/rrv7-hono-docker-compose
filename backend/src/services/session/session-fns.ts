import type { Context } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { config } from '~/lib/config'

export const SESSION_COOKIE_NAME = 'sessionId'

export const SESSION_EXPIRATION_TIME_S = 60 * 60 * 24 * 90 // 90 days in seconds

export const SESSION_CACHE_TTL_S = 60 * 60 // 1 hour in seconds

export async function setSessionCookie(c: Context, sessionId: string) {
	const isProduction = config.NODE_ENV === 'production'

	await setSignedCookie(c, SESSION_COOKIE_NAME, sessionId, config.SIGNATURE, {
		path: '/',
		secure: isProduction,
		httpOnly: true,
		sameSite: isProduction ? 'Strict' : 'Lax',
		maxAge: SESSION_EXPIRATION_TIME_S,
	})
}

export async function getSessionIdFromCookie(c: Context) {
	return await getSignedCookie(c, config.SIGNATURE, SESSION_COOKIE_NAME)
}

export function deleteSessionCookie(c: Context) {
	deleteCookie(c, SESSION_COOKIE_NAME)
}
