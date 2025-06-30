import type { RedirectResponse } from "@l3dev/api-result";
import { err } from "@l3dev/result";
import type { z } from "zod";

import type { Route } from "../types.js";
import type { RouteHook } from "./route-hook.js";
import type { Method, UnsetMarker } from "../types.internal.js";

type Request<TRouteHook extends RouteHook<any>, TMethod extends Method> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TMetadata>
			? {
					method: TMethod;
				} & (TMetadata[`_${Lowercase<TMethod>}`] extends UnsetMarker
					? object
					: { input: z.infer<TMetadata[`_${Lowercase<TMethod>}`]["input"]> }) &
					(keyof TMetadata["_params"] extends never ? object : { params: TMetadata["_params"] })
			: never
		: never;

type Response<TRouteHook extends RouteHook<any>, TMethod extends Method> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TMetadata>
			? TMetadata[`_${Lowercase<TMethod>}`] extends UnsetMarker
				? object
				: Exclude<TMetadata[`_${Lowercase<TMethod>}`]["output"], RedirectResponse<any, any>>
			: never
		: never;

type InputZodError<TRouteHook extends RouteHook<any>, TMethod extends Method> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TMetadata>
			? TMetadata[`_${Lowercase<TMethod>}`] extends UnsetMarker
				? object
				: z.inferFormattedError<TMetadata[`_${Lowercase<TMethod>}`]["input"]>
			: never
		: never;

export function createRequest(baseUrl: string) {
	return async function request<
		TRouteHook extends RouteHook<any>,
		TMethod extends TRouteHook extends RouteHook<infer TRoute>
			? Exclude<keyof TRoute, symbol | number>
			: never
	>(route: TRouteHook, request: Request<TRouteHook, TMethod>) {
		const url = route.buildUrl(request.params, baseUrl);

		const input = "input" in request && request.input;

		if (request.method === "GET" && input) {
			for (const [key, value] of Object.entries(input)) {
				url.searchParams.set(key, (value as { toString(): string }).toString());
			}
		}

		const body = request.method !== "GET" && input ? JSON.stringify(input) : undefined;

		try {
			const response = await fetch(url, {
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
			} as Response<TRouteHook, TMethod>;
		} catch (error) {
			return err("REQUEST_FAILED", {
				error
			});
		}
	};
}
