import type { ILogger } from "@l3dev/logger";
import { logger as defaultLogger } from "@l3dev/logger";
import {
	err,
	Result,
	type Err,
	type Ok,
	type ResultAsyncFn,
	type ResultFn,
	type ReturnResult
} from "@l3dev/result";
// @ts-expect-error Exports don't work for workspace packages
import { ReturnResultSchema } from "@l3dev/result/zod";
import {
	ApplicationCommandType,
	ChatInputCommandInteraction,
	Client,
	Collection,
	MessageFlags,
	REST,
	Routes,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	type APIApplicationCommand,
	type InteractionReplyOptions,
	type RESTGetAPIApplicationGuildCommandsResult,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type Snowflake
} from "discord.js";
import { z } from "zod";

import { mergeMessageFlags } from "./general.js";

type CommandExecuteFn =
	| ResultFn<[ChatInputCommandInteraction]>
	| ResultAsyncFn<[ChatInputCommandInteraction]>;

export type CommandConfig<Builder> = {
	parent?: CommandConfig<SlashCommandBuilder>;
	name: string;
	define: (builder: Builder) => Builder;
	execute: CommandExecuteFn;
} & (Builder extends SlashCommandBuilder
	? { subcommands?: Collection<string, CommandConfig<SlashCommandSubcommandBuilder>> }
	: object);

type CommandModule<Builder> = {
	default: CommandConfig<Builder>;
};

const SlashCommandBuilderSchema = z.custom<SlashCommandBuilder>(
	(data) => data instanceof SlashCommandBuilder
);

const SlashCommandSubcommandBuilderSchema = z.custom<SlashCommandSubcommandBuilder>(
	(data) => data instanceof SlashCommandSubcommandBuilder
);

const ChatInputCommandInteractionSchema = z.custom<ChatInputCommandInteraction>(
	(data) => data instanceof ChatInputCommandInteraction
);

export const CommandConfigSchema = z.object({
	name: z.string(),
	define: z.function(z.tuple([SlashCommandBuilderSchema]), SlashCommandBuilderSchema),
	execute: z.union([
		z.function(z.tuple([ChatInputCommandInteractionSchema]), ReturnResultSchema),
		z.function(z.tuple([ChatInputCommandInteractionSchema]), z.promise(ReturnResultSchema))
	])
});

export const SubcommandConfigSchema = z.object({
	name: z.string(),
	define: z.function(
		z.tuple([SlashCommandSubcommandBuilderSchema]),
		SlashCommandSubcommandBuilderSchema
	),
	execute: z.union([
		z.function(z.tuple([ChatInputCommandInteractionSchema]), ReturnResultSchema),
		z.function(z.tuple([ChatInputCommandInteractionSchema]), z.promise(ReturnResultSchema))
	])
});

export function defineCommand(config: CommandConfig<SlashCommandBuilder>) {
	if (config.subcommands) {
		for (const subcommand of config.subcommands.values()) {
			subcommand.parent = config;
		}
	}
	return config;
}

export function defineSubcommand(config: CommandConfig<SlashCommandSubcommandBuilder>) {
	return config;
}

type LoadOptions<Builder> = {
	modules: Record<string, CommandModule<Builder>>;
	parentCommandName?: string;
	logger?: ILogger;
};

function load<Builder extends SlashCommandBuilder | SlashCommandSubcommandBuilder>({
	modules,
	parentCommandName,
	logger = defaultLogger
}: LoadOptions<Builder>) {
	const commands = new Collection<string, CommandConfig<Builder>>();

	for (const [file, module] of Object.entries(modules)) {
		const command = module.default;
		const result = CommandConfigSchema.safeParse(command);
		if (!result.success) {
			throw new Error(`Command file at ${file} is invalid:`, result.error);
		}

		commands.set(command.name, command);
		logger.log(
			`Loaded command '${parentCommandName ? `${parentCommandName}.${command.name}` : command.name}' (${file})`
		);
	}

	return commands;
}

type LoadCommandsOptions = {
	getModules: <T>() => Record<string, T>;
	logger?: ILogger;
};

export function loadCommands({ getModules, logger = defaultLogger }: LoadCommandsOptions) {
	return load({ modules: getModules<CommandModule<SlashCommandBuilder>>(), logger });
}

type LoadSubcommandsOptions = {
	getModules: <T>() => Record<string, T>;
	parentCommandName: string;
	logger?: ILogger;
};

export function loadSubcommands({
	getModules,
	parentCommandName,
	logger = defaultLogger
}: LoadSubcommandsOptions) {
	const commands = load({
		modules: getModules<CommandModule<SlashCommandSubcommandBuilder>>(),
		parentCommandName,
		logger
	});

	return commands;
}

export function addSubcommands(
	parentCommandBuilder: SlashCommandBuilder,
	subcommands: Collection<string, CommandConfig<SlashCommandSubcommandBuilder>>
) {
	for (const command of subcommands.values()) {
		parentCommandBuilder.addSubcommand(command.define.bind(command));
	}
}

export function hasCommandChanged(
	builder: SlashCommandBuilder,
	current: Omit<APIApplicationCommand, "dm_permission">
) {
	if (builder.name !== current.name) return true;
	if (builder.description !== current.description) return true;
	if ((builder.nsfw ?? false) !== (current.nsfw ?? false)) return true;

	for (const builderOption of builder.options) {
		const json = builderOption.toJSON();
		const currentOption = current.options?.find((opt) => opt.name === json.name);
		if (!currentOption) return true;

		if (json.type !== currentOption.type) return true;
		if (json.description !== currentOption.description) return true;
		if ((json.required ?? false) !== (currentOption.required ?? false)) return true;

		if (
			"autocomplete" in json !== "autocomplete" in currentOption ||
			((json as { autocomplete?: boolean }).autocomplete ?? false) !==
				((currentOption as { autocomplete?: boolean }).autocomplete ?? false)
		) {
			return true;
		}

		if (
			"choices" in json !== "choices" in currentOption ||
			!!(json as { choices?: [] }).choices !== !!(currentOption as { choices?: [] }).choices
		)
			return true;

		if ("choices" in json && "choices" in currentOption && json.choices && currentOption.choices) {
			for (const builderChoice of json.choices) {
				const currentChoice = currentOption.choices.find(
					(choice) => choice.name === builderChoice.name
				);
				if (!currentChoice) return true;

				if (builderChoice.name !== currentChoice.name) return true;
				if (builderChoice.value !== currentChoice.value) return true;
			}
		}
	}

	return false;
}

type Commands = Collection<string, CommandConfig<SlashCommandBuilder>>;
type RegisterCommandsOptions = {
	rest: REST;
	client: Client;
	guildId: Snowflake;
	commands: Commands;
	remove?: string[];
	logger?: ILogger;
};

export const registerCommands = Result.fn(async function ({
	rest,
	client,
	guildId,
	commands,
	remove,
	logger = defaultLogger
}: RegisterCommandsOptions) {
	const route = Routes.applicationGuildCommands(client.user!.id, guildId);

	const existingCommandsResult = await Result.fromPromise(
		{ onError: { type: "FAILED_GET_COMMANDS" } },
		rest.get(route)
	);
	if (!existingCommandsResult.ok) {
		return existingCommandsResult;
	}

	const existingCommands = existingCommandsResult.value as RESTGetAPIApplicationGuildCommandsResult;
	const existingSlashCommands = existingCommands.filter(
		(command) => command.type === ApplicationCommandType.ChatInput
	);

	const results: Promise<ReturnResult<any, any>>[] = [];
	if (remove) {
		logger.log(`Removing commands for guild '${guildId}'...`);

		for (const commandName of remove) {
			const existingCommand = existingSlashCommands.find(
				(existingCommand) => existingCommand.name === commandName
			);
			if (!existingCommand) {
				logger.log(`Skipping command '${commandName}' to remove, not found`);
				continue;
			}

			logger.log(`Removing command '${commandName}'...`);
			results.push(
				Result.fromPromise(
					rest.delete(Routes.applicationGuildCommand(client.user!.id, guildId, existingCommand.id))
				)
			);
		}
	}

	logger.log(`Publishing commands for guild '${guildId}'...`);

	for (const command of commands.values()) {
		const builder = command.define(new SlashCommandBuilder());

		const existingCommand = existingSlashCommands.find(
			(existingCommand) => existingCommand.name === command.name
		);
		if (existingCommand && !hasCommandChanged(builder, existingCommand)) {
			logger.log(`Skipping command '${command.name}', no changes`);
			continue;
		}

		logger.log(`Publishing command '${command.name}'...`);

		let body: RESTPostAPIChatInputApplicationCommandsJSONBody;
		try {
			body = builder.toJSON();
		} catch (error) {
			return err("INVALID_COMMAND", {
				command,
				error
			});
		}
		results.push(
			Result.fromPromise(
				rest.post(route, {
					body
				})
			)
		);
	}

	return await Result.allAsync(...results);
});

export type CommandExecutorConfig = {
	getErrorMessage: (
		err: Err<any, any>,
		interaction: ChatInputCommandInteraction
	) => ReturnResult<InteractionReplyOptions, any>;
};

export type CommandExecutor = ReturnType<typeof createCommandExecutor>;

type CommandExecutorResult =
	| Ok<any>
	| Err<
			"COMMAND_FAILED",
			{ command: string; subcommand?: string; interactionId: string; error: unknown }
	  >
	| Err<"UNKNOWN_SUBCOMMAND", { command: string; subcommand: string; interactionId: string }>
	| Err<"REPLY_ERROR_FAILED", { error: Error }>
	| Err<"REPLY_NOT_FOUND_FAILED", { error: Error }>
	| Err<any, any>;

export const createCommandExecutor = function (config: CommandExecutorConfig) {
	return Result.fn(async function (
		command: CommandConfig<SlashCommandBuilder> | CommandConfig<SlashCommandSubcommandBuilder>,
		interaction: ChatInputCommandInteraction
	): Promise<CommandExecutorResult> {
		const commandName = command.parent?.name ?? command.name;
		const subcommandName = command.parent ? command.name : undefined;

		let result;
		try {
			result = await command.execute(interaction);
		} catch (error) {
			result = err("COMMAND_FAILED", {
				command: commandName,
				subcommand: subcommandName,
				interactionId: interaction.id,
				error
			});
		}

		if (!result.ok) {
			const errorMessageResult = config.getErrorMessage(result, interaction);
			if (!errorMessageResult.ok) {
				return errorMessageResult;
			}

			const errorMessage = errorMessageResult.value;
			const errorFlags = mergeMessageFlags(MessageFlags.Ephemeral, errorMessage.flags);

			if (interaction.replied || interaction.deferred) {
				return await Result.fromPromise(
					{ onError: { type: "REPLY_ERROR_FAILED" } },
					interaction.followUp({
						...errorMessage,
						flags: errorFlags
					})
				);
			}

			return await Result.fromPromise(
				{ onError: { type: "REPLY_ERROR_FAILED" } },
				interaction.reply({
					...errorMessage,
					flags: errorFlags
				})
			);
		}

		return result;
	});
};

export type SubcommandExecutorConfig = {
	commandExecutor: CommandExecutor;
	subcommands: Collection<string, CommandConfig<SlashCommandSubcommandBuilder>>;
	getNotFoundMessage: (
		subcommandName: string,
		interaction: ChatInputCommandInteraction
	) => ReturnResult<InteractionReplyOptions, any>;
};

export function createSubcommandExecutor({
	subcommands,
	commandExecutor,
	getNotFoundMessage
}: SubcommandExecutorConfig) {
	return async (interaction: ChatInputCommandInteraction) => {
		const subcommandName = interaction.options.getSubcommand();
		const subcommand = subcommands.get(subcommandName);

		if (!subcommand) {
			const notFoundMessageResult = getNotFoundMessage(subcommandName, interaction);
			if (!notFoundMessageResult.ok) {
				return notFoundMessageResult;
			}

			const notFoundMessage = notFoundMessageResult.value;
			const notFoundFlags = mergeMessageFlags(MessageFlags.Ephemeral, notFoundMessage.flags);

			let replyResult;
			if (interaction.replied || interaction.deferred) {
				replyResult = await Result.fromPromise(
					{ onError: { type: "REPLY_NOT_FOUND_FAILED" } },
					interaction.followUp({
						...notFoundMessage,
						flags: notFoundFlags
					})
				);
			} else {
				replyResult = await Result.fromPromise(
					{ onError: { type: "REPLY_NOT_FOUND_FAILED" } },
					interaction.reply({
						...notFoundMessage,
						flags: notFoundFlags
					})
				);
			}

			if (!replyResult.ok) {
				return replyResult;
			}

			return err("UNKNOWN_SUBCOMMAND", {
				command: interaction.commandName,
				subcommand: subcommandName,
				interactionId: interaction.id
			});
		}

		return commandExecutor(subcommand, interaction);
	};
}
