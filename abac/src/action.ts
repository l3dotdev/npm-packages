import type { Expand, MakeOptional, UnsetMarker } from "./internal/core.js";
import type { IMeta } from "./internal/meta.js";

export type RuleCtx = {
	subject: any;
	object: any;
};

export type ActionContext = {
	ctx: RuleCtx;
	tags: any;
};

export type InferActionRuleCtx<TAction> =
	TAction extends Action<any, infer TContext> ? TContext["ctx"] : never;

export type InferActionSubject<TAction> = Pick<InferActionRuleCtx<TAction>, "subject">["subject"];

export type InferActionObject<TAction> = Exclude<
	Pick<InferActionRuleCtx<TAction>, "object">["object"],
	void | undefined
>;

export type InferActionAdditionalContext<TAction> = Omit<
	InferActionRuleCtx<TAction>,
	"subject" | "object"
>;

export type ActionTag = "configurable" | (string & {});

export class Action<TName extends string, TContext extends ActionContext> implements IMeta {
	private _name: TName;
	private _title: string | null = null;
	private _description: string | null = null;
	private _tags: Set<TContext["tags"]> = new Set();
	private _noObject: boolean = false;

	constructor(name: TName) {
		this._name = name;
	}

	public get name(): TName {
		return this._name;
	}

	public get title(): string | null {
		return this._title;
	}

	public setTitle(title: string) {
		this._title = title;
		return this;
	}

	public get description(): string | null {
		return this._description;
	}

	public setDescription(description: string) {
		this._description = description;
		return this;
	}

	public get tags(): Set<TContext["tags"]> {
		return this._tags;
	}

	public addTag<TTag extends ActionTag>(tag: TTag) {
		this._tags.add(tag);
		return this as Action<
			TName,
			{
				ctx: TContext["ctx"];
				tags: TContext["tags"] extends UnsetMarker ? TTag : TContext["tags"] | TTag;
			}
		>;
	}

	public setConfigurable<TConfigurable extends boolean>(configurable: TConfigurable) {
		if (configurable) {
			this._tags.add("configurable");
		} else {
			this._tags.delete("configurable");
		}
		return this as Action<
			TName,
			{
				ctx: TContext["ctx"];
				tags: TContext["tags"] extends UnsetMarker
					? TConfigurable extends true
						? "configurable"
						: UnsetMarker
					: TConfigurable extends true
						? TContext["tags"] | "configurable"
						: Exclude<TContext["tags"], "configurable">;
			}
		>;
	}

	public withSubject<TOverrideSubject>() {
		return this as Action<
			TName,
			{
				ctx: {
					subject: TOverrideSubject;
					object: TContext["ctx"]["object"];
				};
				tags: TContext["tags"];
			}
		>;
	}

	public withObject<TOverrideObject>() {
		return this as Action<
			TName,
			{
				ctx: {
					subject: TContext["ctx"]["subject"];
					object: TOverrideObject;
				};
				tags: TContext["tags"];
			}
		>;
	}

	public get noObject() {
		return this._noObject;
	}

	public withoutObject() {
		this._noObject = true;
		return this.withObject<void>();
	}

	public optionalObject() {
		return this.withObject<MakeOptional<TContext["ctx"]["object"]>>();
	}

	public withAdditionalContext<TAdditionalContext extends object>() {
		return this as unknown as Action<
			TName,
			{
				ctx: Expand<TContext["ctx"] & TAdditionalContext>;
				tags: TContext["tags"];
			}
		>;
	}
}
