# discord.js-helpers

> `@l3dev/discord.js-helpers` is deprecated.
> You should use `discordthing` as the new alternative.
>
> See [discordthing](https://github.com/l3dotdev/discordthing) for more information.

## Description

A lightweight framework and collection of helpers for building a discord bot with [`discord.js`](https://www.npmjs.com/package/discord.js)

## Installation

```bash
npm install @l3dev/discord.js-helpers
```

```bash
pnpm add @l3dev/discord.js-helpers
```

## Create a bot

```ts
import { createBot, createCommandExecutor, okMessage } from "@l3dev/discord.js-helpers";
import { EmbedBuilder, Colors } from "discord.js";

import { commands } from "./commands";
import { eventListeners } from "./eventListeners";

const commandExecutor = createCommandExecutor({
	getErrorMessage(msg, _err, _interaction) {
		const embed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle(":warning: Error")
			.setDescription(msg);

		return okMessage({
			embeds: [embed]
		});
	}
});

const client = createBot({
	clientOptions: {
		intents: ["Guilds", "GuildMembers"]
	},
	commandExecutor,
	commands,
	eventListeners
});

client.login(process.env.DISCORD_TOKEN);
```

### Define a command

```ts
// hello-world.command.ts

import { defineCommand } from "@l3dev/discord.js-helpers";
import { Result } from "@l3dev/result";

export default defineCommand({
	name: "hello-world",
	define(builder) {
		return builder.setName(this.name).setDescription("Say hello!");
	},
	async execute(interaction) {
		return await Result.fromPromise(
			{ onError: { type: "HELLO_WORLD_REPLY" } },
			interaction.reply("Hello world!")
		);
	}
});
```

Export commands as a single object:

```ts
// commands.ts

export const commands = {
	helloWorld: await import("./hello-world.command")
};

// or if you are using a bundler like Vite:

export const commands = import.meta.glob<true, string>("./*.command.ts", { eager: true });
```

### Define an event listener

```ts
// welcome.event.ts

import { defineEventListener } from "@l3dev/discord.js-helpers";
import { Result } from "@l3dev/result";
import { Events } from "discord.js";

export default defineEventListener({
	event: Events.GuildMemberAdd,
	async listener(member) {
		const joinChannel = await getJoinChannel(member.guild);

		return await Result.fromPromise(
			{ onError: { type: "WELCOME_MESSAGE" } },
			joinChannel.send(`Welcome <@${member.user.id}>!`)
		);
	}
});
```

Export event listeners as a single object:

```ts
// eventListeners.ts

export const eventListeners = {
	welcome: await import("./welcome.event")
};

// or if you are using a bundler like Vite:

export const eventListeners = import.meta.glob<true, string>("./*.event.ts", { eager: true });
```
