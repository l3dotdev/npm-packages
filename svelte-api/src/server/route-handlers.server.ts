import { ApiResult, type ResponseResult } from "@l3dev/api-result";
import { redirect, type RequestHandler } from "@sveltejs/kit";
import type { z } from "zod";

import type { Endpoint, Route, RouteAny } from "../types.js";

function createRouteHandler(
	method: keyof RouteAny,
	endpoint: Endpoint<any, any, z.ZodAny, ResponseResult<number, any, string | URL, any>>
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

export function createRouteHandlers<TRoute extends Route<any, any, any, any>>(route: TRoute) {
	const handlers: any = {};

	const anyRoute = route as RouteAny;
	if (anyRoute.GET) {
		handlers.GET = createRouteHandler("GET", anyRoute.GET);
	}

	if (anyRoute.POST) {
		handlers.POST = createRouteHandler("POST", anyRoute.POST);
	}

	return handlers as { [method in keyof TRoute]: RequestHandler };
}
