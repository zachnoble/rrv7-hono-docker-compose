import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { defaultColumns, timestamptz } from '../fns'
import { users } from './users'

export const sessions = pgTable(
	'sessions',
	{
		sessionId: text('session_id').primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		expiresAt: timestamptz('expires_at').notNull(),
		...defaultColumns(),
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)],
)
