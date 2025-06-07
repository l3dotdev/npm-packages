import { err, NONE, ok, Result } from "@l3dev/result";
import type { Guild, GuildChannelResolvable, GuildMember, PermissionFlagsBits } from "discord.js";

type HasDiscordPermissionsContext = {
	guild: Guild;
	channel?: GuildChannelResolvable;
};

export async function hasDiscordPermissions(
	member: GuildMember,
	permissions: (keyof typeof PermissionFlagsBits)[],
	{ channel }: HasDiscordPermissionsContext
) {
	const missingPermissions: (keyof typeof PermissionFlagsBits)[] = [];

	for (const permission of permissions) {
		const permissionsIn = channel ? member.permissionsIn(channel) : member.permissions;
		if (!permissionsIn.has(permission, true)) {
			missingPermissions.push(permission);
		}
	}

	if (missingPermissions.length) {
		return err("MISSING_PERMISSIONS", {
			missingPermissions
		});
	}

	return NONE;
}

export async function iHaveDiscordPermissions(
	permissions: (keyof typeof PermissionFlagsBits)[],
	{ guild, channel }: HasDiscordPermissionsContext
) {
	const meResult = guild.members.me
		? ok(guild.members.me)
		: await Result.fromPromise({ onError: { type: "FETCH_ME_FAILED" } }, guild.members.fetchMe());
	if (!meResult.ok) return meResult;

	return hasDiscordPermissions(meResult.value, permissions, { guild, channel });
}
