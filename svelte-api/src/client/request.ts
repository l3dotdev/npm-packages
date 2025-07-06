import type { RedirectResponse } from "@l3dev/api-result";
import { err } from "@l3dev/result";
import type { z } from "zod";

import type { Route } from "../types.js";
import type { RouteHook } from "./route-hook.js";
import type { AnyRouteMetadata, Method, UnsetMarker } from "../types.internal.js";

type RequestInput<
	TMetadata extends AnyRouteMetadata,
	TMethod extends Method
> = TMetadata[`_${Lowercase<TMethod>}`] extends UnsetMarker
	? object
	: TMetadata[`_${Lowercase<TMethod>}`]["input"] extends UnsetMarker
		? object
		: { input: z.infer<TMetadata[`_${Lowercase<TMethod>}`]["input"]> };

type RequestParams<TMetadata extends AnyRouteMetadata> = keyof TMetadata["_params"] extends never
	? object
	: { params: TMetadata["_params"] };

type Request<TRouteHook extends RouteHook<any>, TMethod extends Method> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TMetadata>
			? { method: TMethod } & RequestInput<TMetadata, TMethod> &
					RequestParams<TMetadata> &
					Omit<RequestInit, "method" | "body">
			: never
		: never;

type ResponseOutput<
	TMetadata extends AnyRouteMetadata,
	TMethod extends Method
> = TMetadata[`_${Lowercase<TMethod>}`] extends UnsetMarker
	? object
	: Exclude<TMetadata[`_${Lowercase<TMethod>}`]["output"], RedirectResponse<any, any>>;

type Response<TRouteHook extends RouteHook<any>, TMethod extends Method> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TMetadata>
			? ResponseOutput<TMetadata, TMethod>
			: never
		: never;

type InputZodError<TRouteHook extends RouteHook<any>, TMethod extends Method> =
	TRouteHook extends RouteHook<infer TRoute>
		? TRoute extends Route<infer TMetadata>
			? TMetadata[`_${Lowercase<TMethod>}`] extends UnsetMarker
				? never
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

		const headers = new Headers(request.headers);
		const body = request.method !== "GET" && input ? JSON.stringify(input) : undefined;

		if (body) {
			headers.set("Content-Type", "application/json");
		}

		try {
			const response = await fetch(url, {
				...request,
				body,
				headers
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
