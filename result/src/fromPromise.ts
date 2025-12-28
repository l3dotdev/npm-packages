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
	promise: TPromise,
	config: { onError: { type: TType; context?: TContext } }
): Promise<
	ReturnResult<Awaited<TPromise>, ResultErrorDefinition<TType, TContext & { error: TError }>>
>;
export async function fromPromise<
	TPromise extends Promise<any>,
	const TType extends string,
	TError = Error
>(
	promise: TPromise,
	config: TType
): Promise<ReturnResult<Awaited<TPromise>, ResultErrorDefinition<TType, { error: TError }>>>;
export async function fromPromise<
	TPromise extends Promise<any>,
	const TType,
	TContext extends object,
	TError = Error
>(
	promise: TPromise,
	config?: string | { onError: { type: TType; context?: TContext } }
): Promise<
	ReturnResult<Awaited<TPromise>, ResultErrorDefinition<TType, TContext & { error: TError }>>
> {
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
