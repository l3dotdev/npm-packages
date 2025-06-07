import type { Err } from "./err.js";
import { ok, type Ok } from "./ok.js";
import type { ReturnResult } from "./result.types.js";

export function all<TResults extends ReturnResult<any, any>[]>(
	...results: TResults
): Extract<TResults[number], Err<any, any>> | Ok<Extract<TResults[number], Ok<any>>["value"][]> {
	const values = [];
	for (const result of results) {
		if (!result.ok) {
			return result as Extract<TResults[number], Err<any, any>>;
		}
		values.push(result.value);
	}
	return ok(values);
}

export async function allAsync<
	TResults extends (ReturnResult<any, any> | Promise<ReturnResult<any, any>>)[]
>(
	...results: TResults
): Promise<
	| Extract<Awaited<TResults[number]>, Err<any, any>>
	| Ok<Extract<Awaited<TResults[number]>, Ok<any>>["value"][]>
> {
	const values = [];
	for (const asyncResult of results) {
		const result = await asyncResult;
		if (!result.ok) {
			return result as Extract<Awaited<TResults[number]>, Err<any, any>>;
		}
		values.push(result.value);
	}
	return ok(values);
}

export async function allSettledAsync<
	TResults extends (ReturnResult<any, any> | Promise<ReturnResult<any, any>>)[]
>(...results: TResults): Promise<Awaited<TResults[number]>[]> {
	const settled: Awaited<TResults[number]>[] = [];
	for (const asyncResult of results) {
		settled.push((await asyncResult) as Awaited<TResults[number]>);
	}
	return settled;
}

export function allValues<TResults extends ReturnResult<any, any>[]>(
	...results: TResults
): Extract<TResults[number], Ok<any>>["value"][] {
	const values: any[] = [];
	for (const result of results) {
		if (result.ok) {
			values.push(result.value);
		}
	}
	return values;
}

export function allErrors<TResults extends ReturnResult<any, any>[]>(
	...results: TResults
): Extract<TResults[number], Err<any, any>>[] {
	const errs: Err<any, any>[] = [];
	for (const result of results) {
		if (!result.ok) {
			errs.push(result);
		}
	}
	return errs as Extract<TResults[number], Err<any, any>>[];
}
