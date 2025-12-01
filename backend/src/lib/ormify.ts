import { eq, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core'
import type { QueryResult } from 'pg'
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

	async function create(values: InsertType, tx?: Transaction): Promise<SelectType> {
		const [result] = await (tx ?? db)
			.insert(table as TableParam)
			.values(values)
			.returning()
		return result
	}

	async function update(
		id: string,
		values: Partial<InsertType>,
		tx?: Transaction,
	): Promise<SelectType> {
		const [result] = await (tx ?? db)
			.update(table as TableParam)
			.set(values)
			.where(eq(tableId, id))
			.returning()
		return result
	}

	async function del(id: string, tx?: Transaction): Promise<QueryResult> {
		return await (tx ?? db).delete(table as TableParam).where(eq(tableId, id))
	}

	async function get(id: string, tx?: Transaction): Promise<SelectType | undefined> {
		const [result] = await (tx ?? db)
			.select()
			.from(table as TableParam)
			.where(eq(tableId, id))
		return result
	}

	async function upsert(
		conflictTarget: keyof Table['$inferSelect'],
		values: InsertType,
		tx?: Transaction,
	): Promise<SelectType> {
		const [result] = await (tx ?? db)
			.insert(table as TableParam)
			.values(values)
			.onConflictDoUpdate({
				target: table[conflictTarget] as PgColumn,
				set: values,
			})
			.returning()
		return result
	}

	return {
		create,
		update,
		delete: del,
		get,
		upsert,
	}
}
