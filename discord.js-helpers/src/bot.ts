import type { ILogger } from "@l3dev/logger";
import { logger as defaultLogger } from "@l3dev/logger";
import { err, type ReturnResult } from "@l3dev/result";
import {
	ChatInputCommandInteraction,
	Client,
	Events,
	MessageFlags,
	REST,
	SlashCommandBuilder,
	type ClientOptions
} from "discord.js";

import {
	loadCommands,
	registerCommands,
	type CommandConfig,
	type CommandExecutor
} from "./commands.js";
import { loadEventListeners, registerEventListeners } from "./event-listeners.js";
import { getGuilds } from "./getters.js";
import { mergeModules } from "./merge.js";
import type { Plugin } from "./plugin.js";

export type BotConfig = {
	clientOptions: ClientOptions;
	commandExecutor: CommandExecutor;
	commands?: Record<string, any>;
	eventListeners?: Record<string, any>;
	plugins?: Plugin[];
	logger?: ILogger;
	onReady?: (client: Client<true>) => void | Promise<void>;
	ignoreCommand?: (
		interaction: ChatInputCommandInteraction,
		command?: CommandConfig<SlashCommandBuilder>
	) => boolean;
};

export type ResolvedBotConfig = BotConfig & {
	commands: ReturnType<typeof loadCommands>;
	eventListeners: ReturnType<typeof loadEventListeners>;
};

export function createBot(config: BotConfig) {
	const logger = config.logger ?? defaultLogger;

	const resolvedPlugins = (config.plugins ?? []).map((plugin) => {
		const pluginConfig = typeof plugin === "function" ? plugin(config) : plugin;
		return {
			...pluginConfig,
			commands: pluginConfig.commands ?? {},
			eventListeners: pluginConfig.eventListeners ?? {}
		};
	});

	const commands = loadCommands({
		logger,
		getModules<T>() {
			return mergeModules<T>(
				config.commands ?? {},
				...resolvedPlugins.map((plugin) => plugin.commands)
			);
		}
	});

	const eventListeners = loadEventListeners({
		logger,
		getModules<T>() {
			return mergeModules<T>(
				config.eventListeners ?? {},
				...resolvedPlugins.map((plugin) => plugin.eventListeners)
			);
		}
	});

	const resolvedConfig: ResolvedBotConfig = {
		...config,
		commands,
		eventListeners
	};

	for (const plugin of resolvedPlugins) {
		plugin.resolvedConfig?.(resolvedConfig);
	}

	const client = new Client(config.clientOptions);
	registerEventListeners({ client, eventListeners, logger });

	client.on(Events.ClientReady, async (client) => {
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

		for (const plugin of resolvedPlugins) {
			plugin.onReady?.(client);
		}
		config.onReady?.(client);

		logger.info("Bot Ready");
		if (resolvedPlugins.length) {
			logger.info(`Loaded plugins: ${resolvedPlugins.map((plugin) => plugin.name).join(", ")}`);
		}
	});

	client.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.user.bot || !interaction.isChatInputCommand()) {
			return;
		}

		const command = commands.get(interaction.commandName);
		if (config.ignoreCommand && config.ignoreCommand(interaction, command)) {
			return;
		}

		let result: ReturnResult<any, any>;
		if (!command) {
			result = err("UNKNOWN_COMMAND", {
				command: interaction.commandName,
				interactionId: interaction.id
			});

			const errorMessageResult = resolvedConfig.commandExecutor.getErrorMessage(
				"Command not found",
				result,
				interaction
			);
			if (errorMessageResult.ok) {
				await interaction.reply({
					...errorMessageResult.value,
					flags: MessageFlags.Ephemeral
				});
			} else {
				logger.error("Error while getting error message for unknown command:", errorMessageResult);
			}

			logger.error("Unknown command:", result);
			return;
		}

		const commandResult = await resolvedConfig.commandExecutor.execute(command, interaction);
		if (commandResult.ok) return;

		logger.error("Error while executing command:", commandResult);
	});

	return client;
}
