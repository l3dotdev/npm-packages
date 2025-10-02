import { type Action, type RuleCtx } from "./action.js";
import type { ActionMap, ToActionMap } from "./internal/collections.js";
import type { Expand, UnsetMarker } from "./internal/core.js";

export type ActionGroupContext = {
	ctx: RuleCtx;
	actions: ActionMap | UnsetMarker;
};

export type AnyActionGroupContext = {
	ctx: RuleCtx;
	actions: ActionMap;
};

export class ActionGroup<
	TName extends string,
	TContext extends ActionGroupContext = AnyActionGroupContext
> {
	private _name: TName;
	private _title: string | null = null;
	private _description: string | null = null;
	private _actions: TContext["actions"] = {} as TContext["actions"];

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

	public withSubject<TSubject>() {
		return this as unknown as ActionGroup<
			TName,
			{
				ctx: Expand<
					Omit<TContext["ctx"], "subject"> & {
						subject: TSubject;
					}
				>;
				actions: TContext["actions"];
			}
		>;
	}

	public withObject<TObject>() {
		return this as unknown as ActionGroup<
			TName,
			{
				ctx: Expand<
					Omit<TContext["ctx"], "object"> & {
						object: TObject;
					}
				>;
				actions: TContext["actions"];
			}
		>;
	}

	public withAdditionalContext<TAdditionalContext extends object>() {
		return this as unknown as ActionGroup<
			TName,
			{
				ctx: TContext["ctx"] & TAdditionalContext;
				actions: TContext["actions"];
			}
		>;
	}

	get actions(): TContext["actions"] {
		return this._actions;
	}

	public setActions<TActions extends Action<any, any> | ActionGroup<any, any>>(
		actions: TActions[]
	) {
		this._actions = actions.reduce(
			(acc, action) => ({
				...acc,
				[action.name]: action
			}),
			{}
		);
		return this as unknown as ActionGroup<
			TName,
			{
				ctx: TContext["ctx"];
				actions: Expand<ToActionMap<TActions>>;
			}
		>;
	}
}
