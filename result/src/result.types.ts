import type { Err } from "./err.js";
import type { Ok } from "./ok.js";

export type ResultErrorDefinition<TType, TContext> = {
	type: TType;
	context: TContext;
};

export type ReturnResult<TValue, TError extends ResultErrorDefinition<any, any>> =
	| Ok<TValue>
	| Err<TError["type"], TError["context"]>;

export type ResultFn<
	TInput extends any[] = any[],
	TResult extends ReturnResult<any, any> = ReturnResult<any, any>
> = (...args: TInput) => TResult;

export type ResultAsyncFn<
	TInput extends any[] = any[],
	TResult extends Promise<ReturnResult<any, any>> = Promise<ReturnResult<any, any>>
> = (...args: TInput) => TResult;
