import { Client, SlashCommandBuilder } from "discord.js";

import type { BotConfig, ResolvedBotConfig } from "./bot.js";
import type { CommandModule } from "./commands.js";
import type { EventListenerModule } from "./event-listeners.js";

type PluginConfig = {
	name: string;
	commands?: Record<string, CommandModule<SlashCommandBuilder>>;
	eventListeners?: Record<string, EventListenerModule<any>>;
	resolvedConfig?: (resolvedConfig: ResolvedBotConfig) => void;
	onReady?: (client: Client<true>) => void | Promise<void>;
};

export type Plugin = PluginConfig | ((config: BotConfig) => PluginConfig);

export function definePlugin(config: Plugin) {
	return config;
}
