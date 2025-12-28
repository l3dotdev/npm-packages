import { all, allAsync, allErrors, allSettledAsync, allValues } from "./all.js";
import { err, type Err } from "./err.js";
import { fn } from "./fn.js";
import { from } from "./from.js";
import { fromPromise } from "./fromPromise.js";
import { ok, type Ok } from "./ok.js";
import { pipe } from "./pipe.js";
import { pipeAsync } from "./pipeAsync.js";
import type { ReturnResult } from "./result.types.js";
import { unwrap, unwrapOrDefault } from "./unwrap.js";

export * from "./ok.js";
export * from "./err.js";
export * from "./result.types.js";

function isOk<TResult extends ReturnResult<any, any>>(
	result: TResult
): result is Extract<TResult, Ok<any>> {
	return result.ok;
}

function isErr<TResult extends ReturnResult<any, any>>(
	result: TResult
): result is Extract<TResult, Err<any, any>> {
	return !result.ok;
}

export const Result = {
	ok,
	err,
	pipe,
	pipeAsync,
	fn,
	from,
	fromPromise,
	unwrap,
	unwrapOrDefault,
	all,
	allAsync,
	allSettledAsync,
	allValues,
	allErrors,
	isOk,
	isErr
};
