import { NONE } from "@l3dev/result";
import { Events } from "discord.js";
import type { z } from "zod";

import { defineEventListener, EventListenerConfigSchema, type EventListenerConfig } from "./events";

{
	const onListener = defineEventListener({
		event: Events.InteractionCreate,
		listener: (_interaction) => NONE
	});

	const _type = onListener satisfies EventListenerConfig<any>;
	const _zod = onListener satisfies z.infer<typeof EventListenerConfigSchema>;
}

{
	const onceListener = defineEventListener({
		event: Events.InteractionCreate,
		once: true,
		listener: (_interaction) => NONE
	});

	const _type = onceListener satisfies EventListenerConfig<any>;
	const _zod = onceListener satisfies z.infer<typeof EventListenerConfigSchema>;
}
