import type { ResponseResult } from "@l3dev/api-result";
import type { ZodTypeAny } from "zod";

import type { Endpoint, EndpointHandler, EndpointRequest } from "../types.js";

export interface EndpointBuilderMetadata<
	TParams extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	TRouteId extends string | null = string | null,
	TInput extends ZodTypeAny = ZodTypeAny,
	TOutput extends ResponseResult<any, any, any, any> = ResponseResult<any, any, any, any>
> {
	params: TParams;
	routeId: TRouteId;
	input: TInput;
	output: TOutput;
}

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
		return new EndpointBuilder<
			EndpointBuilderMetadata<
				TMetadata["params"],
				TMetadata["routeId"],
				TInput,
				TMetadata["output"]
			>
		>(input, this._handler);
	}

	public handler<TResponse extends ResponseResult<any, any, any, any>>(
		handler: (
			request: EndpointRequest<TMetadata["params"], TMetadata["routeId"], TMetadata["input"]>
		) => TResponse | Promise<TResponse>
	) {
		return new EndpointBuilder<
			EndpointBuilderMetadata<
				TMetadata["params"],
				TMetadata["routeId"],
				TMetadata["input"],
				TResponse
			>
		>(this._input, handler);
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
