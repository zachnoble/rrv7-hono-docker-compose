import { type SQL, eq } from 'drizzle-orm'
import type { PgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core'
import type { DB, Transaction } from '~/db'

export function ormify<
	Table extends {
		$inferInsert: object
		$inferSelect: object
		getSQL: () => SQL<unknown>
		_: unknown
	},
>(
	db: DB,
	table: Table,
	idColumn: keyof Table['$inferSelect'] = 'id' as keyof Table['$inferSelect'],
) {
	type InsertType = Table['$inferInsert']
	type SelectType = Table['$inferSelect']
	type TableParam = PgTable<TableConfig>

	const tableId = table[idColumn] as PgColumn

	return {
		create: async (values: InsertType, tx?: Transaction): Promise<SelectType> => {
			const [result] = await (tx ?? db)
				.insert(table as TableParam)
				.values(values)
				.returning()
			return result
		},
		update: async (
			id: string,
			values: Partial<InsertType>,
			tx?: Transaction,
		): Promise<SelectType> => {
			const [result] = await (tx ?? db)
				.update(table as TableParam)
				.set(values)
				.where(eq(tableId, id))
				.returning()
			return result
		},
		delete: async (id: string, tx?: Transaction) =>
			await (tx ?? db).delete(table as TableParam).where(eq(tableId, id)),
		getById: async (id: string, tx?: Transaction): Promise<SelectType | undefined> => {
			const [result] = await (tx ?? db)
				.select()
				.from(table as TableParam)
				.where(eq(tableId, id))
			return result
		},
		upsert: async (values: InsertType, tx?: Transaction): Promise<SelectType> => {
			const [result] = await (tx ?? db)
				.insert(table as TableParam)
				.values(values)
				.onConflictDoUpdate({
					target: [tableId],
					set: values,
				})
				.returning()
			return result
		},
	}
}
