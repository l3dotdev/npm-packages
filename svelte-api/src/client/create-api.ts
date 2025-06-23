import { createRequest } from "./request.js";
import type { RouteHook } from "./route-hook.js";

type RouteGroup = {
	[path: string]: RouteGroup | RouteHook<any>;
};

export type SvelteAPI<TRoutes extends RouteGroup> = ReturnType<typeof createAPI<TRoutes>>;

export function createAPI<const TRoutes extends RouteGroup>(config: {
	baseUrl: string;
	routes: TRoutes;
}) {
	return {
		...config.routes,
		request: createRequest(config.baseUrl)
	};
}
