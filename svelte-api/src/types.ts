import type { ResponseResult } from "@l3dev/api-result";
import type { ZodTypeAny } from "zod";

import type { AnyRouteMetadata, EndpointHandler, UnsetMarker } from "./types.internal";

export type Endpoint<
	TParams extends Partial<Record<string, string>>,
	TRouteId extends string | null,
	TInput extends ZodTypeAny,
	TResponse extends ResponseResult<any, any, any, any>
> = {
	input: TInput;
	handler: EndpointHandler<TParams, TRouteId, TInput, TResponse>;
};

export type Route<TMetadata extends AnyRouteMetadata> = (TMetadata["_get"] extends UnsetMarker
	? object
	: {
			GET: Endpoint<
				TMetadata["_params"],
				TMetadata["_routeId"],
				TMetadata["_get"]["input"],
				TMetadata["_get"]["output"]
			>;
		}) &
	(TMetadata["_post"] extends UnsetMarker
		? object
		: {
				POST: Endpoint<
					TMetadata["_params"],
					TMetadata["_routeId"],
					TMetadata["_post"]["input"],
					TMetadata["_post"]["output"]
				>;
			});
