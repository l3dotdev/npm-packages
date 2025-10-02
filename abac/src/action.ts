import type { MakeOptional } from "./internal/core.js";

export type RuleCtx = {
	subject: any;
	object: any;
};

export type ActionContext = {
	ctx: RuleCtx;
	configurable: boolean;
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

export class Action<TName extends string, TContext extends ActionContext> {
	private _name: TName;
	private _title: string | null = null;
	private _description: string | null = null;
	private _configurable: boolean = false;
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

	public get configurable(): boolean {
		return this._configurable;
	}

	public setConfigurable<TConfigurable extends boolean>(configurable: TConfigurable) {
		this._configurable = configurable;
		return this as Action<
			TName,
			{
				ctx: TContext["ctx"];
				configurable: TConfigurable;
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
				configurable: TContext["configurable"];
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
				configurable: TContext["configurable"];
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
		return this as unknown as Action<TName, TContext & TAdditionalContext>;
	}
}
