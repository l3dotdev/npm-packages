import { ok, Result } from "@l3dev/result";
import {
	Client,
	DiscordAPIError,
	Guild,
	type FetchGuildsOptions,
	type Snowflake,
	type TextBasedChannel
} from "discord.js";

export const getGuilds = Result.fn(async function (client: Client, options?: FetchGuildsOptions) {
	return await Result.fromPromise(
		{ onError: { type: "FETCH_GUILDS_FAILED", context: { options } } },
		client.guilds.fetch(options)
	);
});

export const getGuild = Result.fn(async function (client: Client, guildId: Snowflake) {
	const cachedGuild = client.guilds.cache.get(guildId);
	if (cachedGuild) return ok(cachedGuild);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_GUILD_FAILED", context: { guildId } } },
		client.guilds.fetch(guildId)
	);
});

export const getChannel = Result.fn(async function (client: Client, channelId: Snowflake) {
	const cachedChannel = client.channels.cache.get(channelId);
	if (cachedChannel) return ok(cachedChannel);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_CHANNEL_FAILED", context: { channelId } } },
		client.channels.fetch(channelId)
	);
});

export const getGuildMember = Result.fn(async function (guild: Guild, memberId: Snowflake) {
	const cachedMember = guild.members.cache.get(memberId);
	if (cachedMember) return ok(cachedMember);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_GUILD_MEMBER_FAILED", context: { guildId: guild.id, memberId } } },
		guild.members.fetch(memberId)
	);
});

export const getMessage = Result.fn(async function (
	channel: TextBasedChannel,
	messageId: Snowflake
) {
	const cachedMessage = channel.messages.cache.get(messageId);
	if (cachedMessage) return ok(cachedMessage);

	const fetchResult = await Result.fromPromise(
		{ onError: { type: "FETCH_MESSAGE_FAILED", context: { channelId: channel.id, messageId } } },
		channel.messages.fetch(messageId)
	);

	if (!fetchResult.ok) {
		if (
			fetchResult.context.error instanceof DiscordAPIError &&
			fetchResult.context.error.code === 10008
		) {
			return ok(null);
		}
	}

	return fetchResult;
});
