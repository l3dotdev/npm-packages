import { NONE } from "@l3dev/result";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import type { z } from "zod";

import {
	CommandConfigSchema,
	defineCommand,
	defineSubcommand,
	SubcommandConfigSchema,
	type CommandConfig
} from "./commands.js";

{
	const command = defineCommand({
		name: "",
		define: (builder) => builder,
		execute: () => NONE
	});

	const _type = command satisfies CommandConfig<SlashCommandBuilder>;
	const _zod = command satisfies z.infer<typeof CommandConfigSchema>;
}

{
	const command = defineSubcommand({
		name: "",
		define: (builder) => builder,
		execute: () => NONE
	});

	const _type = command satisfies CommandConfig<SlashCommandSubcommandBuilder>;
	const _zod = command satisfies z.infer<typeof SubcommandConfigSchema>;
}
