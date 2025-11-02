import type { ResponseResult } from "@l3dev/api-result";
import type { RequestEvent } from "@sveltejs/kit";
import type { z } from "zod";

export type UnsetMarker = "unset" & {
	__brand: "unsetMarker";
};

export type Method = "GET" | "POST";

export interface AnyRouteMetadata {
	_params: any;
	_routeId: any;
	_get: any;
	_post: any;
}

export type EndpointRequest<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TInput extends z.ZodType
> = {
	event: RequestEvent<TParams, TRouteId>;
	input: z.infer<TInput>;
};

export type EndpointHandler<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TInput extends z.ZodType,
	TResponse extends ResponseResult<any, any, any, any>
> = (request: EndpointRequest<TParams, TRouteId, TInput>) => TResponse | Promise<TResponse>;
