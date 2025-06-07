import { ok, type Err, type Ok, type ResultAsyncFn, type ResultFn } from "@l3dev/result";
import { ModalBuilder } from "discord.js";

type ModalBuildFn<
	TInput extends [ModalBuilder, ...any] = [ModalBuilder, ...any],
	TResult extends Ok<ModalBuilder> | Err<any, any> = Ok<ModalBuilder> | Err<any, any>
> = ResultFn<TInput, TResult> | ResultAsyncFn<TInput, Promise<TResult>>;

export type ModalConfig<BuildFn extends ModalBuildFn> = {
	build: BuildFn;
};

export function defineModal<
	BuildFn extends ModalBuildFn,
	Params extends any[] = Parameters<BuildFn> extends [ModalBuilder, ...infer R] ? R : never
>(config: ModalConfig<BuildFn>) {
	return {
		build: ((...args: Params) => {
			const builder = new ModalBuilder();
			return config.build(builder, ...args);
		}) as BuildFn extends ResultFn<any, infer R>
			? ResultFn<Params, R>
			: BuildFn extends ResultAsyncFn<any, infer R>
				? ResultAsyncFn<Params, R>
				: never
	};
}

export function okModal(modal: ModalBuilder) {
	return ok(modal);
}
