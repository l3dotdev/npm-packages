import type { RedirectResponse } from "@l3dev/api-result";
import { err } from "@l3dev/result";
import type { z } from "zod";

import type {
	Endpoint,
	GetEndpoint,
	InferEndpointInput,
	InferEndpointResponse,
	Route
} from "../types.js";
import type { RouteHook } from "./route-hook.js";

type RouteMethod<TRouteHook extends RouteHook<any>> =
	TRouteHook extends RouteHook<infer TRoute> ? Exclude<keyof TRoute, symbol | number> : never;

type Request<TRouteHook extends RouteHook<any>, TMethod extends RouteMethod<TRouteHook>> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TParams, any, any, any>
			? {
					method: TMethod;
					// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				} & (TParams extends {} ? object : { params: TParams }) &
					(GetEndpoint<TRoute, TMethod> extends never
						? object
						: { input: InferEndpointInput<GetEndpoint<TRoute, TMethod>> })
			: never
		: never;

type InputZodError<TRouteHook extends RouteHook<any>, TMethod extends RouteMethod<TRouteHook>> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<any, any, any, any>
			? GetEndpoint<TRoute, TMethod> extends Endpoint<any, any, infer TInput, any>
				? z.inferFormattedError<TInput>
				: never
			: never
		: never;

export function createRequest(baseUrl: string) {
	return async function request<
		TRouteHook extends RouteHook<any>,
		TMethod extends RouteMethod<TRouteHook>
	>(route: TRouteHook, request: Request<TRouteHook, TMethod>) {
		const url = new URL(route.routeId!, baseUrl);

		const input = "input" in request && request.input;

		if (request.method === "GET" && input) {
			for (const [key, value] of Object.entries(input)) {
				url.searchParams.set(key, (value as { toString(): string }).toString());
			}
		}

		const body = request.method !== "GET" && input ? JSON.stringify(input) : undefined;

		try {
			const response = await fetch(route.routeId!, {
				method: request.method,
				body,
				headers: {
					...(body ? { "Content-Type": "application/json" } : {})
				}
			});

			const responseBody = await response.json();

			if (!responseBody.ok && responseBody.type === "INVALID_INPUT") {
				return err("INVALID_INPUT", {
					error: responseBody.context as InputZodError<TRouteHook, TMethod>
				});
			}

			return {
				status: response.status,
				...responseBody
			} as TRouteHook extends RouteHook<infer TRoute>
				? Exclude<InferEndpointResponse<GetEndpoint<TRoute, TMethod>>, RedirectResponse<any, any>>
				: never;
		} catch (error) {
			return err("REQUEST_FAILED", {
				error
			});
		}
	};
}
