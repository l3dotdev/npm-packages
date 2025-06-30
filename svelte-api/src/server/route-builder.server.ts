import type { EmptyResponse } from "@l3dev/api-result";
import type { RequestEvent } from "@sveltejs/kit";
import { z, type ZodAny } from "zod";

import type { Endpoint, Route } from "../types.js";
import { EndpointBuilder, type EndpointBuilderMetadata } from "./endpoint-builder.server.js";

export interface RouteBuilderMetadata<
	TParams extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	TRouteId extends string | null = string | null,
	TGet extends Endpoint<any, any, any, any> | undefined = Endpoint<any, any, any, any> | undefined,
	TPost extends Endpoint<any, any, any, any> | undefined = Endpoint<any, any, any, any> | undefined
> {
	params: TParams;
	routeId: TRouteId;
	GET: TGet;
	POST: TPost;
}

class RouteBuilder<TMetadata extends RouteBuilderMetadata> {
	private route: Route<
		TMetadata["params"],
		TMetadata["routeId"],
		TMetadata["GET"],
		TMetadata["POST"]
	>;

	constructor(
		route?: Route<TMetadata["params"], TMetadata["routeId"], TMetadata["GET"], TMetadata["POST"]>
	) {
		this.route =
			route ??
			({} as Route<TMetadata["params"], TMetadata["routeId"], TMetadata["GET"], TMetadata["POST"]>);
	}

	public GET<TEndpointMetadata extends EndpointBuilderMetadata>(
		apply: (
			builder: EndpointBuilder<
				EndpointBuilderMetadata<TMetadata["params"], TMetadata["routeId"], ZodAny, EmptyResponse>
			>
		) => EndpointBuilder<TEndpointMetadata>
	) {
		const endpointBuilder = apply(
			new EndpointBuilder<
				EndpointBuilderMetadata<TMetadata["params"], TMetadata["routeId"], ZodAny, EmptyResponse>
			>(z.any(), null)
		);
		const endpoint = endpointBuilder.build();

		return new RouteBuilder<
			RouteBuilderMetadata<
				TMetadata["params"],
				TMetadata["routeId"],
				Endpoint<
					TEndpointMetadata["params"],
					TEndpointMetadata["routeId"],
					TEndpointMetadata["input"],
					TEndpointMetadata["output"]
				>,
				TMetadata["POST"]
			>
		>({
			...this.route,
			GET: endpoint
		});
	}

	public POST<TEndpointMetadata extends EndpointBuilderMetadata>(
		apply: (
			builder: EndpointBuilder<
				EndpointBuilderMetadata<TMetadata["params"], TMetadata["routeId"], ZodAny, EmptyResponse>
			>
		) => EndpointBuilder<TEndpointMetadata>
	) {
		const endpointBuilder = apply(
			new EndpointBuilder<
				EndpointBuilderMetadata<TMetadata["params"], TMetadata["routeId"], ZodAny, EmptyResponse>
			>(z.any(), null)
		);
		const endpoint = endpointBuilder.build();

		return new RouteBuilder<
			RouteBuilderMetadata<
				TMetadata["params"],
				TMetadata["routeId"],
				TMetadata["GET"],
				Endpoint<
					TEndpointMetadata["params"],
					TEndpointMetadata["routeId"],
					TEndpointMetadata["input"],
					TEndpointMetadata["output"]
				>
			>
		>({
			...this.route,
			POST: endpoint
		});
	}

	public build() {
		return this.route satisfies Route<
			TMetadata["params"],
			TMetadata["routeId"],
			TMetadata["GET"],
			TMetadata["POST"]
		>;
	}
}

export function createRouteBuilder<TRequestEvent extends RequestEvent>() {
	return new RouteBuilder<
		RouteBuilderMetadata<TRequestEvent["params"], TRequestEvent["route"]["id"]>
	>();
}
