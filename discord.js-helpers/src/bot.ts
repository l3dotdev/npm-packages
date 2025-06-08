import type { ILogger } from "@l3dev/logger";
import { logger as defaultLogger } from "@l3dev/logger";
import { Client, REST, type ClientOptions } from "discord.js";

import { loadCommands, registerCommands } from "./commands.js";
import { loadEventListeners, registerEventListeners } from "./event-listeners.js";
import { getGuilds } from "./getters.js";
import { mergeModules } from "./merge.js";
import type { Plugin } from "./plugin.js";

export type BotConfig = {
	clientOptions: ClientOptions;
	commands?: Record<string, any>;
	eventListeners?: Record<string, any>;
	plugins?: Plugin[];
	logger?: ILogger;
	onReady?: (client: Client<true>) => void | Promise<void>;
};

export function createBot(config: BotConfig) {
	const logger = config.logger ?? defaultLogger;

	const eventListeners = loadEventListeners({
		logger,
		getModules<T>() {
			return mergeModules<T>(
				config.eventListeners ?? {},
				...(config.plugins?.map((plugin) => plugin.eventListeners).filter((modules) => !!modules) ??
					[])
			);
		}
	});

	const commands = loadCommands({
		logger,
		getModules<T>() {
			return mergeModules<T>(
				config.commands ?? {},
				...(config.plugins?.map((plugin) => plugin.commands).filter((modules) => !!modules) ?? [])
			);
		}
	});

	const client = new Client(config.clientOptions);
	registerEventListeners({ client, eventListeners, logger });

	client.on("ready", async (client) => {
		const rest = new REST({ version: "10" }).setToken(client.token);

		const guildsResult = await getGuilds(client);
		if (!guildsResult.ok) {
			logger.fatal("Error while fetching guilds", guildsResult);
			await client.destroy();
			return;
		}

		const guilds = guildsResult.value;
		for (const guild of guilds.values()) {
			const result = await registerCommands({
				logger,
				client,
				rest,
				guildId: guild.id,
				commands
			});
			if (!result.ok) {
				logger.error(`Failed to register commands for guild ${guild.id}`, result);
			}
		}

		for (const plugin of config.plugins ?? []) {
			plugin.onReady?.(client);
		}
		config.onReady?.(client);

		logger.info("Bot Ready");
		if (config.plugins?.length) {
			logger.info(`Loaded plugins: ${config.plugins?.map((plugin) => plugin.name).join(", ")}`);
		}
	});

	return client;
}
