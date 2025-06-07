import type { ErrResponse } from "./err.js";
import type { OkResponse } from "./ok.js";
import type { RedirectResponse } from "./redirect.js";

export type ResponseErrorDefinition<TType, TContext extends object | null> = {
	type: TType;
	context: TContext;
};

export type ResponseResult<
	TStatus extends number,
	TValue,
	TRedirect extends string | URL,
	TError extends ResponseErrorDefinition<any, any>
> =
	| OkResponse<TValue, TStatus>
	| RedirectResponse<TRedirect, TStatus>
	| ErrResponse<TError["type"], TError["context"], TStatus>;
