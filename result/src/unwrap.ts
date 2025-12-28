import type { Ok } from "./ok";
import type { ReturnResult } from "./result.types";

export type UnwrapResult<TResult extends ReturnResult<any, any>> =
	TResult extends Ok<infer TValue>
		? TValue extends ReturnResult<any, any>
			? UnwrapResult<TValue>
			: TResult
		: TResult;

export function unwrap<TResult extends ReturnResult<any, any>>(
	result: TResult
): UnwrapResult<TResult> {
	if (result.ok && typeof result.value === "object" && "ok" in result.value) {
		return unwrap(result.value);
	}
	return result as UnwrapResult<TResult>;
}

export function unwrapOrDefault<
	TResult extends ReturnResult<any, any>,
	TValue = TResult extends Ok<infer TValue> ? TValue : never
>(result: TResult, defaultValue: NoInfer<TValue>): TValue {
	const unwrapped = unwrap(result);
	return unwrapped.ok ? unwrapped.value : defaultValue;
}
