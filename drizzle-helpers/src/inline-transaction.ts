import { logger } from "@l3dev/logger";
import { err, NONE, type None } from "@l3dev/result";
import { TransactionRollbackError, type ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction, PgTransactionConfig } from "drizzle-orm/pg-core";

type InlineTransactionProp = keyof typeof InlineTransactionImpl.prototype;

type TransactionAction = "commit" | "rollback";

type InlineTransactionConfig = PgTransactionConfig & {
	onDispose?: TransactionAction;
};

export class InlineTransactionImpl<TSchema extends Record<string, unknown>> {
	public static async create<TSchema extends Record<string, unknown>>(
		db: NodePgDatabase<TSchema>,
		config?: InlineTransactionConfig
	) {
		const tx = new InlineTransactionImpl(db, config) as InlineTransaction<TSchema>;
		await tx.readyPromise;
		return tx;
	}

	private tx: PgTransaction<
		NodePgQueryResultHKT,
		TSchema,
		ExtractTablesWithRelations<TSchema>
	> | null = null;
	private txPromise: Promise<void>;
	private actionResolve: ((action: TransactionAction) => void) | null = null;
	private readyPromise: Promise<void>;

	private onDispose: TransactionAction | null = null;
	private _open = true;
	get open() {
		return this._open;
	}

	[Symbol.asyncDispose] = async () => {
		if (!this._open) return;

		if (!this.onDispose) {
			logger.error(
				"Transaction disposed before commit or rollback with not 'onDispose' set, rolling back transaction..."
			);
			this.onDispose = "rollback";
		}

		if (this.onDispose === "commit") {
			const commitResult = await this.commit();
			if (!commitResult.ok) {
				logger.error("Failed to commit transaction:", commitResult);
			}
			return;
		}

		const rollbackResult = await this.rollback();
		if (!rollbackResult.ok) {
			logger.error("Failed to rollback transaction:", rollbackResult);
		}
	};

	constructor(db: NodePgDatabase<TSchema>, config?: InlineTransactionConfig) {
		const { onDispose, ...restConfig } = config ?? {};
		this.onDispose = onDispose ?? null;

		let ready: () => void;
		this.readyPromise = new Promise<void>((resolve) => {
			ready = resolve;
		});

		const actionPromise = new Promise<TransactionAction>((resolve) => {
			this.actionResolve = resolve;
		});
		this.txPromise = db.transaction(async (tx) => {
			this.tx = tx;
			ready();
			const action = await actionPromise;
			this._open = false;
			if (action === "rollback") {
				tx.rollback();
			}
		}, restConfig);

		return new Proxy(this, {
			get: (target, prop) => {
				const value = target[prop as InlineTransactionProp];
				if (typeof value === "function") {
					return value.bind(target);
				}
				if (prop in target) {
					return target[prop as InlineTransactionProp];
				}

				const txValue = (target.tx as any)[prop];
				return typeof txValue === "function" ? txValue.bind(target.tx) : txValue;
			},
			set: (target, prop, value) => {
				(target.tx as any)[prop] = value;
				return true;
			}
		});
	}

	public async commit<TReturn = never>(afterCommit?: () => TReturn | Promise<TReturn>) {
		this.actionResolve!("commit");
		try {
			await this.txPromise;
			return (afterCommit ? await afterCommit() : NONE) as TReturn extends never ? None : TReturn;
		} catch (error) {
			return err("TRANSACTION_COMMIT_FAILED", {
				error
			});
		}
	}

	public async rollback<TReturn = never>(afterRollback?: () => TReturn | Promise<TReturn>) {
		this.actionResolve!("rollback");
		try {
			await this.txPromise;
		} catch (error) {
			if (!(error instanceof TransactionRollbackError)) {
				return err("TRANSACTION_ROLLBACK_FAILED", {
					error
				});
			}
		}

		return (afterRollback ? await afterRollback() : NONE) as TReturn extends never ? None : TReturn;
	}
}

export type InlineTransaction<TSchema extends Record<string, unknown>> =
	InlineTransactionImpl<TSchema> &
		PgTransaction<NodePgQueryResultHKT, TSchema, ExtractTablesWithRelations<TSchema>>;
