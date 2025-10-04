import type { Context } from 'hono'

export type UserSessionDTO = {
	id: string
	email: string
	name: string
}

export type CreateSessionDTO = {
	userId: string
	c?: Context
}
