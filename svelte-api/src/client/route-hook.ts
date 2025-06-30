import type { Route } from "../types.js";

export class RouteHook<TRoute extends Route<any>> {
	constructor(
		public readonly routeId: TRoute extends Route<infer TMetadata> ? TMetadata["_routeId"] : never
	) {}

	buildUrl(
		params: TRoute extends Route<infer TMetadata> ? TMetadata["_params"] : never,
		baseUrl: string
	) {
		const path = (this.routeId as string).replace(/\[(\w+)\]/g, (_, key) => params[key]);
		return new URL(path, baseUrl);
	}
}

export function route<const TRoute extends Route<any>>(
	routeId: TRoute extends Route<infer TMetadata> ? TMetadata["_routeId"] : never
) {
	return new RouteHook<TRoute>(routeId);
}
