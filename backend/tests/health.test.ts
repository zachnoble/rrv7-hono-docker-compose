import { describe, expect, it } from 'bun:test'
import { client } from './lib/test-client'

describe('Health Routes', () => {
	describe('GET /health', () => {
		it('should return 200', async () => {
			const res = await client.get('/health')
			expect(res.status).toBe(200)
			expect(res.data).toEqual({
				status: 200,
				message: 'Service running. Postgres and Valkey are reachable.',
				timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
			})
		})
	})

	describe('GET /readiness', () => {
		it('should return 200', async () => {
			const res = await client.get('/readiness')
			expect(res.status).toBe(200)
			expect(res.data).toEqual({
				message: 'Service running.',
				timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
			})
		})
	})
})
