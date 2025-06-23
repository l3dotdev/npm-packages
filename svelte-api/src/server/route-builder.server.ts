import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";

import type { Endpoint, Route } from "../types.js";
import {
	EndpointBuilder,
	type EndpointBuilderMetadata,
	type GetInitialEndpointBuilderMetadata
} from "./endpoint-builder.server.js";

export interface RouteBuilderMetadata {
	params: Partial<Record<string, string>>;
	routeId: string | null;
	GET: Endpoint<any, any, any, any> | undefined;
	POST: Endpoint<any, any, any, any> | undefined;
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
			builder: EndpointBuilder<GetInitialEndpointBuilderMetadata<TMetadata>>
		) => EndpointBuilder<TEndpointMetadata>
	) {
		const endpointBuilder = apply(
			new EndpointBuilder<GetInitialEndpointBuilderMetadata<TMetadata>>(z.any(), null)
		);
		const endpoint = endpointBuilder.build();

		return new RouteBuilder<{
			params: TMetadata["params"];
			routeId: TMetadata["routeId"];
			GET: Endpoint<
				TEndpointMetadata["params"],
				TEndpointMetadata["routeId"],
				TEndpointMetadata["input"],
				TEndpointMetadata["output"]
			>;
			POST: TMetadata["POST"];
		}>({
			...this.route,
			GET: endpoint
		});
	}

	public POST<TEndpointMetadata extends EndpointBuilderMetadata>(
		apply: (
			builder: EndpointBuilder<GetInitialEndpointBuilderMetadata<TMetadata>>
		) => EndpointBuilder<TEndpointMetadata>
	) {
		const endpointBuilder = apply(
			new EndpointBuilder<GetInitialEndpointBuilderMetadata<TMetadata>>(z.any(), null)
		);
		const endpoint = endpointBuilder.build();

		return new RouteBuilder<{
			params: TMetadata["params"];
			routeId: TMetadata["routeId"];
			GET: TMetadata["GET"];
			POST: Endpoint<
				TEndpointMetadata["params"],
				TEndpointMetadata["routeId"],
				TEndpointMetadata["input"],
				TEndpointMetadata["output"]
			>;
		}>({
			...this.route,
			POST: endpoint
		});
	}

	public build() {
		return this.route;
	}
}

export function createRouteBuilder<TRequestEvent extends RequestEvent>() {
	return new RouteBuilder<{
		params: TRequestEvent["params"];
		routeId: TRequestEvent["route"]["id"];
		GET: undefined;
		POST: undefined;
	}>();
}
