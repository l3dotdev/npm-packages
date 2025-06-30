import { ApiResult, type ResponseResult } from "@l3dev/api-result";
import { redirect, type RequestHandler } from "@sveltejs/kit";
import type { ZodAny } from "zod";

import type { Method } from "../types.internal.js";
import type { Endpoint, Route } from "../types.js";

function createRouteHandler(
	method: Method,
	endpoint: Endpoint<any, any, ZodAny, ResponseResult<number, any, string | URL, any>>
) {
	const requestHandler: RequestHandler = async (event) => {
		const body =
			method === "GET" ? Object.fromEntries(event.url.searchParams) : await event.request.json();
		const { success, data: input, error } = endpoint.input.safeParse(body);
		if (!success) {
			return Response.json(
				{
					ok: false,
					type: "INVALID_INPUT",
					context: error
				},
				{
					status: 400
				}
			);
		}

		const result = await endpoint.handler({
			event,
			input
		});
		if (!result.ok) {
			return Response.json(
				{
					ok: false,
					type: result.type,
					context: result.context
				},
				{ status: result.status }
			);
		}

		if (ApiResult.isRedirect(result)) {
			redirect(result.status, result.value.target);
		}

		return Response.json(
			{
				ok: true,
				value: result.value
			},
			{ status: result.status }
		);
	};
	return requestHandler;
}

export function createRouteHandlers<TRoute extends Route<any>>(route: TRoute) {
	const handlers: any = {};

	if ("GET" in route) {
		handlers.GET = createRouteHandler("GET", route.GET);
	}

	if ("POST" in route) {
		handlers.POST = createRouteHandler("POST", route.POST);
	}

	return handlers as { [method in keyof TRoute]: RequestHandler };
}
