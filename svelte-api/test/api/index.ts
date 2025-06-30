import { default as $resource } from "./[resource]/route.server";
import { createAPI, route } from "../../src/client";

export const api = createAPI({
	baseUrl: "http://localhost",
	routes: {
		resource: route<typeof $resource>("/api/[resource]")
	}
});

const response = await api.request(api.resource, {
	method: "GET",
	params: {
		resource: "dogs"
	},
	input: {
		token: "token"
	}
});
