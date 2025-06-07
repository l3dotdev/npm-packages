import type { ReturnResult } from "./result.types.js";

const SHOULD_NEVER_THROW_MESSAGE = "A result function should never throw an error";

export function fn<
	TResult extends ReturnResult<any, any> | Promise<ReturnResult<any, any>>,
	TFn extends (...args: any[]) => TResult
>(fn: TFn): TFn {
	return function (this: ThisParameterType<TFn>, ...args: Parameters<TFn>) {
		let result;
		try {
			result = fn.call(this, ...args);
		} catch (error) {
			throw new Error(SHOULD_NEVER_THROW_MESSAGE, {
				cause: error
			});
		}

		if (result instanceof Promise) {
			// eslint-disable-next-line no-async-promise-executor
			return new Promise(async (resolve, reject) => {
				try {
					resolve(await result);
				} catch (error) {
					reject(
						new Error(SHOULD_NEVER_THROW_MESSAGE, {
							cause: error
						})
					);
				}
			});
		}

		return result;
	} as TFn;
}
