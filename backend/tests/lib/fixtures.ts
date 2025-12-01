import bcrypt from 'bcryptjs'
import { randomUUIDv7 } from 'bun'
import { db } from '~/db'
import { sessions, users, verificationTokens } from '~/db/models'

export async function basicUser(
	overrides: Partial<typeof users.$inferInsert> & { password?: string } = {},
) {
	const password = overrides.password ?? 'test-password123!@#$'
	const passwordHash = await bcrypt.hash(password, 2)

	const [user] = await db
		.insert(users)
		.values({
			email: 'test@example.com',
			name: 'Test User',
			password,
			passwordHash,
			isVerified: true,
			...overrides,
		})
		.returning()

	return {
		...user,
		password,
	}
}

export async function basicVerificationToken(
	overrides: Partial<typeof verificationTokens.$inferInsert> & {
		userId: string
		type: typeof verificationTokens.$inferInsert.type
	},
) {
	const [token] = await db
		.insert(verificationTokens)
		.values({
			token: randomUUIDv7(),
			expiresAt: new Date(Date.now() + 1000),
			...overrides,
		})
		.returning()
	return token
}

export async function basicSession(
	overrides: Partial<typeof sessions.$inferInsert> & { userId: string },
) {
	const [session] = await db
		.insert(sessions)
		.values({
			sessionId: randomUUIDv7(),
			expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000), // 1 day
			...overrides,
		})
		.returning()
	return session
}
