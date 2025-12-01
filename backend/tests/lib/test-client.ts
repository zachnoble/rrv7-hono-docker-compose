import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { HeadersInit } from 'bun'
import { eq } from 'drizzle-orm'
import { serializeSigned } from 'hono/utils/cookie'
import { db } from '~/db'
import { sessions, users } from '~/db/models'
import { config } from '~/lib/config'
import { app } from '~/server'

type Params = Record<string, string | number | boolean>

type RequestOptions = {
	method?: string
	headers?: HeadersInit
	body?: unknown
	params?: Params
}

type TestResponse = {
	status: number
	headers: Headers
	// biome-ignore lint/suspicious/noExplicitAny: allow any type for tests
	data: any
}

export class TestClient {
	private user: typeof users.$inferSelect | null = null
	private session: typeof sessions.$inferSelect | null = null
	private sessionCookie: string | null = null

	private async deleteUser() {
		if (this.user) {
			await db.delete(users).where(eq(users.id, this.user.id))
		}
	}

	private async deleteSession() {
		if (this.session) {
			await db.delete(sessions).where(eq(sessions.sessionId, this.session.sessionId))
		}
	}

	private async createSessionForUser(userId: string) {
		const sessionId = randomBytes(64).toString('hex')

		const [session] = await db
			.insert(sessions)
			.values({
				sessionId,
				userId,
				expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000), // 1 day
			})
			.returning()

		return session
	}

	private async createSignedSessionCookie(sessionId: string) {
		const signedCookie = await serializeSigned('sessionId', sessionId, config.SIGNATURE)
		return signedCookie.split(';')[0]
	}

	private buildUrl(url: string, params?: Params) {
		const baseUrl = url === '/' ? '' : url

		if (!params || Object.keys(params).length === 0) {
			return baseUrl
		}

		const searchParams = new URLSearchParams()
		for (const [key, value] of Object.entries(params)) {
			searchParams.append(key, value.toString())
		}

		return `${baseUrl}?${searchParams.toString()}`
	}

	private buildHeaders(options: RequestOptions) {
		const headers = new Headers(options.headers)
		headers.set('Content-Type', 'application/json')
		return headers
	}

	private async parseResponseData(response: Response) {
		const contentType = response.headers.get('content-type')
		const isJson = contentType?.includes('application/json')
		return isJson ? await response.json() : response.text()
	}

	async makeRequest(url: string, options: RequestOptions = {}) {
		if (this.sessionCookie) {
			const headers = new Headers(options.headers ?? {})

			if (!headers.has('Cookie')) {
				headers.set('Cookie', this.sessionCookie)
			}

			options.headers = headers
		}

		const headers = this.buildHeaders(options)
		const finalUrl = this.buildUrl(url, options.params)

		const response = await app.request(finalUrl, {
			method: options.method ?? 'GET',
			headers,
			body: JSON.stringify(options.body),
		})

		const data = await this.parseResponseData(response)

		return {
			status: response.status,
			headers: response.headers,
			data,
		} as TestResponse
	}

	async get(path: string, params?: Params) {
		return this.makeRequest(path, { method: 'GET', params })
	}

	async post(path: string, body: unknown = {}, params?: Params) {
		return this.makeRequest(path, {
			method: 'POST',
			body,
			params,
		})
	}

	async patch(path: string, body: unknown = {}, params?: Params) {
		return this.makeRequest(path, {
			method: 'PATCH',
			body,
			params,
		})
	}

	async put(path: string, body: unknown = {}, params?: Params) {
		return this.makeRequest(path, {
			method: 'PUT',
			body,
			params,
		})
	}

	async delete(path: string, params?: Params) {
		return this.makeRequest(path, {
			method: 'DELETE',
			params,
		})
	}

	getUser() {
		if (!this.user) throw new Error('Call `authenticate()` to set an authenticated user')
		return this.user
	}

	async authenticate(userId?: string) {
		// If a user ID is provided, use that user
		// Otherwise, create a new user to authenticate with
		const user = userId
			? (await db.select().from(users).where(eq(users.id, userId)))[0]
			: (
					await db
						.insert(users)
						.values({
							email: 'authenticated@domain.com',
							name: 'Test User',
							passwordHash: await bcrypt.hash('authenticated123$%', 2),
							isVerified: true,
						})
						.returning()
				)[0]
		const session = await this.createSessionForUser(user.id)
		const sessionCookie = await this.createSignedSessionCookie(session.sessionId)

		this.user = user
		this.session = session
		this.sessionCookie = sessionCookie

		return user
	}

	async clearAuthentication({
		deleteSession = true,
		deleteUser = false,
	}: {
		deleteSession?: boolean
		deleteUser?: boolean
	} = {}) {
		await Promise.all([deleteSession && this.deleteSession(), deleteUser && this.deleteUser()])

		this.session = null
		this.user = null
		this.sessionCookie = null
	}
}

export const client = new TestClient()
