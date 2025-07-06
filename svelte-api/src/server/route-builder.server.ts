import { type ResponseResult } from "@l3dev/api-result";
import type { RequestEvent } from "@sveltejs/kit";
import { z, type ZodTypeAny } from "zod";

import type {
	AnyRouteMetadata,
	EndpointHandler,
	EndpointRequest,
	UnsetMarker
} from "../types.internal.js";
import type { Route } from "../types.js";

class EndpointBuilder<TEndpoint extends "get" | "post", TMetadata extends AnyRouteMetadata> {
	private _input: ZodTypeAny = z.any();
	private _handler: EndpointHandler<any, any, any, any> | null = null;

	public input<TInput extends ZodTypeAny>(input: TInput) {
		this._input = input;

		return this as EndpointBuilder<
			TEndpoint,
			{
				_params: TMetadata["_params"];
				_routeId: TMetadata["_routeId"];
				_get: TEndpoint extends "get"
					? {
							input: TInput;
							output: TMetadata["_get"]["output"];
						}
					: TMetadata["_get"];
				_post: TEndpoint extends "post"
					? {
							input: TInput;
							output: TMetadata["_post"]["output"];
						}
					: TMetadata["_post"];
			}
		>;
	}

	public handler<TResponse extends ResponseResult<any, any, any, any>>(
		handler: (
			request: EndpointRequest<
				TMetadata["_params"],
				TMetadata["_routeId"],
				TMetadata[`_${TEndpoint}`]["input"]
			>
		) => TResponse | Promise<TResponse>
	) {
		this._handler = handler;

		return this as EndpointBuilder<
			TEndpoint,
			{
				_params: TMetadata["_params"];
				_routeId: TMetadata["_routeId"];
				_get: TEndpoint extends "get"
					? {
							input: TMetadata["_get"]["input"];
							output: TResponse;
						}
					: TMetadata["_get"];
				_post: TEndpoint extends "post"
					? {
							input: TMetadata["_post"]["input"];
							output: TResponse;
						}
					: TMetadata["_post"];
			}
		>;
	}

	public build() {
		if (!this._handler) {
			throw new Error("Handler not set");
		}

		return {
			input: this._input,
			handler: this._handler
		};
	}
}

class RouteBuilder<TMetadata extends AnyRouteMetadata> {
	private route: any;

	constructor() {
		this.route = {};
	}

	public get<TNewMetadata extends AnyRouteMetadata>(
		apply: (
			builder: EndpointBuilder<
				"get",
				{
					_params: TMetadata["_params"];
					_routeId: TMetadata["_routeId"];
					_get: {
						input: UnsetMarker;
						output: UnsetMarker;
					};
					_post: TMetadata["_post"];
				}
			>
		) => EndpointBuilder<"get", TNewMetadata>
	) {
		const endpointBuilder = apply(
			new EndpointBuilder<
				"get",
				{
					_params: TMetadata["_params"];
					_routeId: TMetadata["_routeId"];
					_get: {
						input: UnsetMarker;
						output: UnsetMarker;
					};
					_post: TMetadata["_post"];
				}
			>()
		);
		const endpoint = endpointBuilder.build();

		this.route.GET = endpoint;

		return this as unknown as RouteBuilder<TNewMetadata>;
	}

	public post<TNewMetadata extends AnyRouteMetadata>(
		apply: (
			builder: EndpointBuilder<
				"post",
				{
					_params: TMetadata["_params"];
					_routeId: TMetadata["_routeId"];
					_get: TMetadata["_get"];
					_post: {
						input: UnsetMarker;
						output: UnsetMarker;
					};
				}
			>
		) => EndpointBuilder<"post", TNewMetadata>
	) {
		const endpointBuilder = apply(
			new EndpointBuilder<
				"post",
				{
					_params: TMetadata["_params"];
					_routeId: TMetadata["_routeId"];
					_get: TMetadata["_get"];
					_post: {
						input: UnsetMarker;
						output: UnsetMarker;
					};
				}
			>()
		);
		const endpoint = endpointBuilder.build();

		this.route.POST = endpoint;

		return this as unknown as RouteBuilder<TNewMetadata>;
	}

	public build() {
		return this.route as Route<TMetadata>;
	}
}

export type { RouteBuilder, EndpointBuilder };

export function createRouteBuilder<TRequestEvent extends RequestEvent>() {
	return new RouteBuilder<{
		_params: TRequestEvent["params"];
		_routeId: TRequestEvent["route"]["id"];
		_get: UnsetMarker;
		_post: UnsetMarker;
	}>();
}
