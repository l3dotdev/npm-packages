import { type Action, type RuleCtx } from "./action.js";
import type { ActionGroup } from "./actionGroup.js";
import type {
	ActionMap,
	ResourceMap,
	ToActionMap,
	UnionToResourceMap
} from "./internal/collections.js";
import type { Expand, UnsetMarker } from "./internal/core.js";
import type { IMeta } from "./internal/meta.js";

export type ResourceContext = {
	ctx: RuleCtx;
	actions: ActionMap | UnsetMarker;
	subResources: ResourceMap | UnsetMarker;
	ownable: boolean;
};

export type AnyResourceContext = {
	ctx: RuleCtx;
	actions: ActionMap;
	subResources: ResourceMap;
	ownable: boolean;
};

export class Resource<TName extends string, TContext extends ResourceContext = AnyResourceContext>
	implements IMeta
{
	private _name: TName;
	private _title: string | null = null;
	private _description: string | null = null;
	private _ownable: TContext["ownable"] = false;
	private _actions: TContext["actions"] = {} as TContext["actions"];
	private _subResources: TContext["subResources"] = {} as TContext["subResources"];

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

	public get ownable(): boolean {
		return this._ownable;
	}

	public setOwnable<TOwnable extends boolean>(ownable: TOwnable) {
		this._ownable = ownable;
		return this as unknown as Resource<
			TName,
			{
				ctx: TContext["ctx"];
				actions: TContext["actions"];
				subResources: TContext["subResources"];
				ownable: TOwnable;
			}
		>;
	}

	public withSubject<TSubject>() {
		return this as unknown as Resource<
			TName,
			{
				ctx: Expand<
					Omit<TContext["ctx"], "subject"> & {
						subject: TSubject;
					}
				>;
				actions: TContext["actions"];
				subResources: TContext["subResources"];
				ownable: TContext["ownable"];
			}
		>;
	}

	public withObject<TObject>() {
		return this as unknown as Resource<
			TName,
			{
				ctx: Expand<
					Omit<TContext["ctx"], "object"> & {
						object: TObject;
					}
				>;
				actions: TContext["actions"];
				subResources: TContext["subResources"];
				ownable: TContext["ownable"];
			}
		>;
	}

	public withAdditionalContext<TAdditionalContext extends object>() {
		return this as unknown as Resource<
			TName,
			{
				ctx: Expand<TContext["ctx"] & TAdditionalContext>;
				actions: TContext["actions"];
				subResources: TContext["subResources"];
				ownable: TContext["ownable"];
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
		return this as unknown as Resource<
			TName,
			{
				ctx: TContext["ctx"];
				actions: Expand<ToActionMap<TActions>>;
				subResources: TContext["subResources"];
				ownable: TContext["ownable"];
			}
		>;
	}

	get subResources(): TContext["subResources"] {
		return this._subResources;
	}

	public setSubResources<TResources extends Resource<any, any>>(resources: TResources[]) {
		this._subResources = resources.reduce(
			(acc, resource) => ({
				...acc,
				[resource.name]: resource
			}),
			{}
		);
		return this as unknown as Resource<
			TName,
			{
				ctx: TContext["ctx"];
				actions: TContext["actions"];
				subResources: Expand<UnionToResourceMap<TResources>>;
				ownable: TContext["ownable"];
			}
		>;
	}
}
