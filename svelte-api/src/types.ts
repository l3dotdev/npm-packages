import type { ResponseResult } from "@l3dev/api-result";
import type { RequestEvent } from "@sveltejs/kit";
import type { z, ZodTypeAny } from "zod";

export type EndpointRequest<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TInput extends ZodTypeAny
> = {
	event: RequestEvent<TParams, TRouteId>;
	input: z.infer<TInput>;
};

export type EndpointHandler<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TInput extends ZodTypeAny,
	TResponse extends ResponseResult<any, any, any, any>
> = (request: EndpointRequest<TParams, TRouteId, TInput>) => TResponse | Promise<TResponse>;

export type Endpoint<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TInput extends ZodTypeAny,
	TResponse extends ResponseResult<any, any, any, any>
> = {
	input: TInput;
	handler: EndpointHandler<TParams, TRouteId, TInput, TResponse>;
};

export type GetEndpoint<TRoute extends Route<any, any, any, any>, TMethod extends keyof TRoute> =
	TRoute extends Route<any, any, infer TGET, infer TPOST>
		? TMethod extends "GET"
			? TGET
			: TMethod extends "POST"
				? TPOST
				: never
		: never;

export type InferEndpointInput<TEndpoint> =
	TEndpoint extends Endpoint<any, any, infer TInput, any> ? z.infer<TInput> : never;

export type InferEndpointResponse<TEndpoint> =
	TEndpoint extends Endpoint<any, any, any, infer TResponse> ? TResponse : never;

export type Route<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TGET extends Endpoint<TParams, TRouteId, any, any> | undefined = Endpoint<
		TParams,
		TRouteId,
		any,
		any
	>,
	TPOST extends Endpoint<TParams, TRouteId, any, any> | undefined = Endpoint<
		TParams,
		TRouteId,
		any,
		any
	>
> = (TGET extends Endpoint<TParams, TRouteId, any, any> ? { GET: TGET } : object) &
	(TPOST extends Endpoint<TParams, TRouteId, any, any> ? { POST: TPOST } : object);

export type RouteAny = Partial<Route<any, any>>;
