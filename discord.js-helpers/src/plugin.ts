import { Client, SlashCommandBuilder } from "discord.js";

import type { CommandModule } from "./commands.js";
import type { EventListenerModule } from "./event-listeners.js";

export type Plugin = {
	name: string;
	commands?: Record<string, CommandModule<SlashCommandBuilder>>;
	eventListeners?: Record<string, EventListenerModule<any>>;
	onReady?: (client: Client<true>) => void | Promise<void>;
};

export function definePlugin(config: Plugin) {
	return config;
}
