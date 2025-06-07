import type { Route } from "../types.js";

export class RouteHook<TRoute extends Route<any, any, any, any>> {
	constructor(
		public readonly routeId: TRoute extends Route<any, infer TRouteId, any, any> ? TRouteId : never
	) {}
}

export function route<const TRoute extends Route<any, any, any, any>>(
	routeId: TRoute extends Route<any, infer TRouteId, any, any> ? TRouteId : never
) {
	return new RouteHook<TRoute>(routeId);
}
