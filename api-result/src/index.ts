import { err, fromErr, type ErrResponse } from "./err.js";
import { ok, type OkResponse } from "./ok.js";
import { redirect, type RedirectResponse } from "./redirect.js";
import type { ResponseResult } from "./result.types.js";

export * from "./ok.js";
export { err, type ErrResponse } from "./err.js";
export * from "./redirect.js";
export * from "./result.types.js";

function isOk<TResult extends ResponseResult<any, any, any, any>>(
	result: TResult
): result is Extract<TResult, OkResponse<any, any>> {
	return result.ok;
}

function isRedirect<TResult extends ResponseResult<any, any, any, any>>(
	result: TResult
): result is Extract<TResult, RedirectResponse<any, any>> {
	return result.ok && "redirect" in result && result.redirect;
}

function isErr<TResult extends ResponseResult<any, any, any, any>>(
	result: TResult
): result is Extract<TResult, ErrResponse<any, any, any>> {
	return !result.ok;
}

export const ApiResult = {
	ok,
	err,
	redirect,
	fromErr,
	isOk,
	isRedirect,
	isErr
};
