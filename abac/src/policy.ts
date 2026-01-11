import { ABAC } from "./abac.js";
import type { Action, RuleCtx, InferActionRuleCtx, ActionContext } from "./action.js";
import type { ResourceMap } from "./internal/collections.js";
import type {
	ActionFromPath,
	ActionPaths,
	OwnableActionPaths,
	WildcardActionPaths
} from "./internal/paths.js";

export type MatchCtx = {
	subject: any;
};

export type PolicyMatchPredicate = (ctx: MatchCtx) => boolean;

type InferRulePredicateReturn<TAction> =
	TAction extends Action<any, infer TContext extends ActionContext>
		? "configurable" extends TContext["tags"]
			? "ifgranted" | boolean
			: boolean
		: boolean;

type SimplifyPredicate<T> = T extends (ctx: infer TCtx) => infer TReturn
	? (ctx: TCtx) => TReturn
	: T;

export type RulePredicate<TResources extends ResourceMap, TActionPath extends string> = (
	ctx: InferActionRuleCtx<ActionFromPath<TResources, TActionPath>>,
	action: ActionFromPath<TResources, TActionPath>
) => InferRulePredicateReturn<ActionFromPath<TResources, TActionPath>>;

type AnyRulePredicate = (ctx: RuleCtx, action: Action<any, any>) => boolean | "ifgranted";

export type OwnershipPredicate<TResources extends ResourceMap, TActionPath extends string> = (
	ctx: InferActionRuleCtx<ActionFromPath<TResources, TActionPath>>
) => boolean;

export enum Specitivity {
	Any = -1,
	ActionsAndNested,
	ActionsOnly,
	OwnedActionsOnly,
	Exact
}

export type Rule = {
	action: string;
	predicate: AnyRulePredicate;
	specitivity?: Specitivity;
};

export class Policy<TResources extends ResourceMap> {
	private _name: string | null = null;
	private _match: PolicyMatchPredicate = ABAC.Filter.allow();
	private _rules: Rule[] = [];

	constructor() {}

	public get name() {
		return this._name;
	}

	public setName(name: string) {
		this._name = name;
		return this;
	}

	public get match() {
		return this._match;
	}

	public setMatch(predicate: PolicyMatchPredicate) {
		this._match = predicate;
		return this;
	}

	public get rules() {
		return this._rules;
	}

	public allowAll({ force = false }: { force?: boolean } = {}) {
		this.pushRule("*", ABAC.Filter.allow(), force ? Specitivity.Exact : undefined);
		return this;
	}

	public denyAll({ force = false }: { force?: boolean } = {}) {
		this.pushRule("*", ABAC.Filter.deny(), force ? Specitivity.Exact : undefined);
		return this;
	}

	public allow<TActionPath extends WildcardActionPaths<TResources>>(
		action: TActionPath,
		predicate?: AnyRulePredicate,
		options?: { specitivity?: Specitivity }
	): this;
	public allow<TActionPath extends ActionPaths<TResources>>(
		action: TActionPath,
		predicate: SimplifyPredicate<RulePredicate<TResources, TActionPath>>,
		options?: { specitivity?: Specitivity }
	): this;
	public allow(
		action: string,
		predicate?: any,
		{ specitivity }: { specitivity?: Specitivity } = {}
	) {
		this.pushRule(action, predicate ?? ABAC.Filter.allow(), specitivity);
		return this;
	}

	public allowOwn<TActionPath extends OwnableActionPaths<TResources>>(
		action: TActionPath,
		checkOwnership: SimplifyPredicate<OwnershipPredicate<TResources, TActionPath>>,
		predicate?: SimplifyPredicate<RulePredicate<TResources, TActionPath>>,
		{ specitivity }: { specitivity?: Specitivity } = {}
	) {
		this.pushRule(`${action}.own`, ABAC.Filter.allow(), specitivity);
		this.pushRule(
			action,
			(ctx: any, action: any) => {
				if (!checkOwnership(ctx)) {
					return false;
				}

				return (predicate ?? ABAC.Filter.allow())(ctx, action);
			},
			specitivity
		);
		return this;
	}

	public deny<TActionPath extends WildcardActionPaths<TResources>>(
		action: TActionPath,
		options?: { specitivity?: Specitivity }
	): this;
	public deny<TActionPath extends ActionPaths<TResources>>(
		action: TActionPath,
		options?: { specitivity?: Specitivity }
	): this;
	public deny(action: string, { specitivity }: { specitivity?: Specitivity } = {}) {
		this.pushRule(action, ABAC.Filter.deny(), specitivity);
		return this;
	}

	public denyOwn<TActionPath extends OwnableActionPaths<TResources>>(
		action: TActionPath,
		checkOwnership: SimplifyPredicate<OwnershipPredicate<TResources, TActionPath>>,
		otherPredicate?: SimplifyPredicate<RulePredicate<TResources, TActionPath>>,
		{ specitivity }: { specitivity?: Specitivity } = {}
	) {
		this.pushRule(`${action}.own`, ABAC.Filter.deny(), specitivity);
		this.pushRule(
			action,
			(ctx: any, action: any) => {
				if (checkOwnership(ctx)) {
					return false;
				}

				return (otherPredicate ?? ABAC.Filter.allow())(ctx, action);
			},
			specitivity
		);
		return this;
	}

	private pushRule(action: string, predicate: AnyRulePredicate, specitivity?: Specitivity) {
		this._rules.push({ action, predicate, specitivity });
	}
}
