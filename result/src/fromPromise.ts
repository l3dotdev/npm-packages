import { err } from "./err.js";
import { ok } from "./ok.js";
import type { ResultErrorDefinition, ReturnResult } from "./result.types.js";

export async function fromPromise<TPromise extends Promise<any>, TError = Error>(
	promise: TPromise
): Promise<ReturnResult<Awaited<TPromise>, ResultErrorDefinition<null, { error: TError }>>>;
export async function fromPromise<
	TPromise extends Promise<any>,
	const TType,
	TContext extends object,
	TError = Error
>(
	config: { onError: { type: TType; context?: TContext } },
	promise: TPromise
): Promise<
	ReturnResult<Awaited<TPromise>, ResultErrorDefinition<TType, TContext & { error: TError }>>
>;
export async function fromPromise<
	TPromise extends Promise<any>,
	const TType extends string,
	TError = Error
>(
	config: TType,
	promise: TPromise
): Promise<ReturnResult<Awaited<TPromise>, ResultErrorDefinition<TType, { error: TError }>>>;
export async function fromPromise<
	TPromise extends Promise<any>,
	const TType,
	TContext extends object,
	TError = Error
>(
	configOrPromise: string | { onError: { type: TType; context?: TContext } } | TPromise,
	promise?: TPromise
): Promise<
	ReturnResult<Awaited<TPromise>, ResultErrorDefinition<TType, TContext & { error: TError }>>
> {
	let config: string | { onError: { type: TType; context?: TContext } } | null = null;
	if (!promise && configOrPromise instanceof Promise) {
		promise = configOrPromise;
	} else if (!(configOrPromise instanceof Promise)) {
		config = configOrPromise;
	}

	try {
		const value = await promise!;
		return ok(value);
	} catch (error) {
		let type, context;
		if (typeof config === "string") {
			type = config as TType;
			context = {};
		} else {
			type = (config?.onError.type ?? null) as TType;
			context = config?.onError.context ?? {};
		}

		return err(type, {
			...context,
			error: error as TError
		} as TContext & { error: TError });
	}
}
