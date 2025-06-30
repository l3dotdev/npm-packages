import { err, ok } from "@l3dev/api-result";
import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";

import { createRouteBuilder } from "../../../src/server";

type Event = RequestEvent<{ resource: string }, "/api/[resource]">;

export const ParamsSchema = z.object({
	token: z.string()
});

export default createRouteBuilder<Event>()
	.get((endpoint) =>
		endpoint.input(ParamsSchema).handler(async ({ input }) => {
			if (!input.token) {
				return err("INVALID_TOKEN");
			}

			return ok({
				message: "Success"
			});
		})
	)
	.build();
