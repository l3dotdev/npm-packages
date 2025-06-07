import { ok, Result } from "@l3dev/result";
import {
	BitField,
	Client,
	Guild,
	MessageFlags,
	type BitFieldResolvable,
	type MessageFlagsString,
	type Snowflake,
	type TextBasedChannel
} from "discord.js";

export function mergeMessageFlags<TFlag extends MessageFlagsString, TType extends MessageFlags>(
	...flags: (BitFieldResolvable<TFlag, TType> | null | undefined)[]
) {
	const mergedFlags: (TFlag | TType | `${bigint}`)[] = [];

	for (const flag of flags) {
		if (!flag) continue;

		if (Array.isArray(flag)) {
			mergedFlags.push(...flag);
		} else if (flag instanceof BitField) {
			mergedFlags.push(flag.bitfield);
		} else {
			mergedFlags.push(flag as TFlag | TType | `${bigint}`);
		}
	}

	return mergedFlags;
}

export const getGuild = Result.fn(async function (client: Client, guildId: Snowflake) {
	const cachedGuild = client.guilds.cache.get(guildId);
	if (cachedGuild) return ok(cachedGuild);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_GUILD_FAILED" } },
		client.guilds.fetch(guildId)
	);
});

export const getChannel = Result.fn(async function (client: Client, channelId: Snowflake) {
	const cachedChannel = client.channels.cache.get(channelId);
	if (cachedChannel) return ok(cachedChannel);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_CHANNEL_FAILED" } },
		client.channels.fetch(channelId)
	);
});

export const getGuildChannel = Result.fn(async function (guild: Guild, memberId: Snowflake) {
	const cachedMember = guild.members.cache.get(memberId);
	if (cachedMember) return ok(cachedMember);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_GUILD_MEMBER_FAILED" } },
		guild.members.fetch(memberId)
	);
});

export const getMessage = Result.fn(async function (
	channel: TextBasedChannel,
	messageId: Snowflake
) {
	const cachedMessage = channel.messages.cache.get(messageId);
	if (cachedMessage) return ok(cachedMessage);

	return await Result.fromPromise(
		{ onError: { type: "FETCH_GUILD_MEMBER_FAILED" } },
		channel.messages.fetch(messageId)
	);
});
