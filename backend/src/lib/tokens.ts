import { randomBytes } from 'node:crypto'

export function generateSecureToken(bytes = 64) {
	return randomBytes(bytes).toString('hex')
}
