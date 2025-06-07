import type { EmptyResponse, ResponseResult } from "@l3dev/api-result";
import type { z, ZodTypeAny } from "zod";

import type { Endpoint, EndpointHandler, EndpointRequest } from "../types.js";
import type { RouteBuilderMetadata } from "./route-builder.server.js";

export interface EndpointBuilderMetadata {
	params: Partial<Record<string, string>>;
	routeId: string | null;
	input: ZodTypeAny;
	output: ResponseResult<any, any, any, any>;
}

export type GetInitialEndpointBuilderMetadata<TMetadata extends RouteBuilderMetadata> = {
	params: TMetadata["params"];
	routeId: TMetadata["routeId"];
	input: z.ZodAny;
	output: EmptyResponse;
};

export class EndpointBuilder<TMetadata extends EndpointBuilderMetadata> {
	private _input: TMetadata["input"];
	private _handler: EndpointHandler<
		TMetadata["params"],
		TMetadata["routeId"],
		TMetadata["input"],
		TMetadata["output"]
	> | null = null;

	constructor(
		input: TMetadata["input"],
		handler: EndpointHandler<
			TMetadata["params"],
			TMetadata["routeId"],
			TMetadata["input"],
			TMetadata["output"]
		> | null
	) {
		this._input = input;
		this._handler = handler;
	}

	public input<TInput extends ZodTypeAny>(input: TInput) {
		return new EndpointBuilder<{
			params: TMetadata["params"];
			routeId: TMetadata["routeId"];
			input: TInput;
			output: TMetadata["output"];
		}>(input, this._handler);
	}

	public handler<TResponse extends ResponseResult<any, any, any, any>>(
		handler: (
			request: EndpointRequest<TMetadata["params"], TMetadata["routeId"], TMetadata["input"]>
		) => TResponse | Promise<TResponse>
	) {
		return new EndpointBuilder<{
			params: TMetadata["params"];
			routeId: TMetadata["routeId"];
			input: TMetadata["input"];
			output: TResponse;
		}>(this._input, handler);
	}

	public build() {
		if (!this._handler) {
			throw new Error("Handler not set");
		}

		return {
			input: this._input,
			handler: this._handler
		} satisfies Endpoint<
			TMetadata["params"],
			TMetadata["routeId"],
			TMetadata["input"],
			TMetadata["output"]
		>;
	}
}
