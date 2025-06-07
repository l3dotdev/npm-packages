import { ok, type Err, type Ok, type ResultAsyncFn, type ResultFn } from "@l3dev/result";
import {
	type BaseMessageOptions,
	type InteractionReplyOptions,
	type MessageCreateOptions
} from "discord.js";

type MessageBuildFn<
	TInput extends any[] = any[],
	TResult extends Ok<BaseMessageOptions> | Err<any, any> = Ok<BaseMessageOptions> | Err<any, any>
> = ResultFn<TInput, TResult> | ResultAsyncFn<TInput, Promise<TResult>>;

export type MessageConfig<BuildFn extends MessageBuildFn> = {
	build: BuildFn;
};

export function defineMessage<BuildFn extends MessageBuildFn>(config: MessageConfig<BuildFn>) {
	return config;
}

export function okMessage<TOptions extends MessageCreateOptions>(value: TOptions) {
	return ok(value);
}

export function okReply<TOptions extends InteractionReplyOptions>(value: TOptions) {
	return ok(value);
}
