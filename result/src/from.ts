import { err } from "./err.js";
import { ok } from "./ok.js";
import type { ResultErrorDefinition, ReturnResult } from "./result.types.js";

export function from<TReturn, TError = Error>(
	wrapper: () => TReturn
): ReturnResult<TReturn, ResultErrorDefinition<null, { error: TError }>>;
export function from<TReturn, const TType, TContext extends object, TError = Error>(
	config: { onError: { type: TType; context?: TContext } },
	wrapper: () => TReturn
): ReturnResult<TReturn, ResultErrorDefinition<TType, TContext & { error: TError }>>;
export function from<TReturn, const TType extends string, TError = Error>(
	errorType: TType,
	wrapper: () => TReturn
): ReturnResult<TReturn, ResultErrorDefinition<TType, { error: TError }>>;
export function from<TReturn, const TType, TContext extends object, TError = Error>(
	configOrWrapper: string | { onError: { type: TType; context?: TContext } } | (() => TReturn),
	wrapper?: () => TReturn
): ReturnResult<TReturn, ResultErrorDefinition<TType, TContext & { error: TError }>> {
	let config: string | { onError: { type: TType; context?: TContext } } | null = null;
	if (!wrapper && typeof configOrWrapper === "function") {
		wrapper = configOrWrapper;
	} else if (typeof configOrWrapper !== "function") {
		config = configOrWrapper;
	}

	try {
		const value = wrapper!();
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
