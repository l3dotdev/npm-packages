import { Result } from "@l3dev/result";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres/driver";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres/session";
import type { PgTransaction, PgTransactionConfig } from "drizzle-orm/pg-core/session";

import { InlineTransactionImpl } from "./inline-transaction.js";

export * from "./inline-transaction.js";

export type WrappedDrizzle<TSchema extends Record<string, unknown>> = ReturnType<
	typeof wrapDrizzle<TSchema, NodePgDatabase<TSchema>>
>;

export function wrapDrizzle<
	TSchema extends Record<string, unknown>,
	TDatabase extends NodePgDatabase<TSchema>
>(db: TDatabase) {
	return Object.assign(db, {
		inlineTransaction(config?: PgTransactionConfig) {
			return InlineTransactionImpl.create<TSchema>(db, config);
		},
		safeExecute<TType extends string, T>(type: TType, statement: { execute: () => Promise<T> }) {
			return Result.fromPromise({ onError: { type } }, statement.execute());
		},
		safeTransaction<TType extends string, T>(
			type: TType,
			transaction: (
				tx: PgTransaction<NodePgQueryResultHKT, TSchema, ExtractTablesWithRelations<TSchema>>
			) => Promise<T>,
			config?: PgTransactionConfig
		) {
			return Result.fromPromise({ onError: { type } }, db.transaction(transaction, config));
		}
	});
}
