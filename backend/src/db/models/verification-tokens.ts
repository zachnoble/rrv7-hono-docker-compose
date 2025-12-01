import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { defaultColumns } from '../fns'
import { users } from './users'

export const tokenTypeEnum = pgEnum('verification_token_type', [
	'email_verification',
	'password_reset',
])

export const verificationTokens = pgTable(
	'verification_tokens',
	{
		token: text('token').primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		type: tokenTypeEnum('type').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		...defaultColumns(),
	},
	(table) => [index('verification_tokens_user_id_idx').on(table.userId)],
)
