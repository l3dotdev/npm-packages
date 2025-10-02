import type { Action, RuleCtx } from "../action.js";
import type { ActionGroup } from "../actionGroup.js";
import type { Resource } from "../resource.js";
import type { ResourceMap } from "./collections.js";
import type { EmptyObject, Expand, MakeOptional, OptionalMarker, UnsetMarker } from "./core.js";

type ActionNames<TActionMap, TExcludeEmptyObjects extends boolean = false> = {
	[actionName in keyof TActionMap]: TActionMap[actionName] extends Action<
		infer TActionName,
		infer TActionContext
	>
		? TActionContext["ctx"] extends EmptyObject
			? TExcludeEmptyObjects extends true
				? never
				: `:${TActionName}`
			: `:${TActionName}`
		: TActionMap[actionName] extends ActionGroup<infer TGroupName, infer TGroupContext>
			? `.${TGroupName}${ActionNames<TGroupContext["actions"], TExcludeEmptyObjects>}`
			: never;
}[keyof TActionMap];

export type OwnableActionPaths<TResources extends ResourceMap> = {
	[resourceName in Extract<keyof TResources, string>]:
		| (TResources[resourceName]["subResources"] extends UnsetMarker
				? never
				: `${resourceName}.${OwnableActionPaths<TResources[resourceName]["subResources"]>}`)
		| (TResources[resourceName] extends Resource<any, infer TResourceContext>
				? TResourceContext["ownable"] extends true
					? TResources[resourceName]["actions"] extends UnsetMarker
						? never
						: `${resourceName}${ActionNames<TResources[resourceName]["actions"], true>}`
					: never
				: never);
}[Extract<keyof TResources, string>];

export type ActionPaths<TResources extends ResourceMap> =
	| {
			[resourceName in Extract<keyof TResources, string>]:
				| (TResources[resourceName]["subResources"] extends UnsetMarker
						? never
						: `${resourceName}.${ActionPaths<TResources[resourceName]["subResources"]>}`)
				| (TResources[resourceName]["actions"] extends UnsetMarker
						? never
						: `${resourceName}${ActionNames<TResources[resourceName]["actions"]>}`);
	  }[Extract<keyof TResources, string>]
	| `${OwnableActionPaths<TResources>}.own`;

type ActionNamesWithWildcards<TActionMap> = {
	[actionName in keyof TActionMap]: TActionMap[actionName] extends ActionGroup<
		infer TGroupName,
		infer TGroupContext
	>
		? `.${TGroupName}${ActionNamesWithWildcards<TGroupContext["actions"]>}` | `.${TGroupName}:*`
		: never;
}[keyof TActionMap];

export type OwnableWildcardActionPaths<TResources extends ResourceMap> = {
	[resourceName in Extract<keyof TResources, string>]: TResources[resourceName] extends Resource<
		any,
		infer TResourceContext
	>
		? TResourceContext["ownable"] extends true
			?
					| `${resourceName}:*`
					| (TResources[resourceName]["subResources"] extends UnsetMarker
							? never
							: `${resourceName}.${OwnableWildcardActionPaths<TResources[resourceName]["subResources"]>}`)
					| (TResources[resourceName]["actions"] extends UnsetMarker
							? never
							: `${resourceName}${ActionNamesWithWildcards<TResources[resourceName]["actions"]>}`)
			: never
		: never;
}[Extract<keyof TResources, string>];

export type WildcardActionPaths<TResources extends ResourceMap> =
	| {
			[resourceName in Extract<keyof TResources, string>]:
				| (TResources[resourceName]["subResources"] extends UnsetMarker
						? never
						: `${resourceName}.${WildcardActionPaths<TResources[resourceName]["subResources"]>}`)
				| (TResources[resourceName]["actions"] extends UnsetMarker
						? never
						: `${resourceName}${ActionNamesWithWildcards<TResources[resourceName]["actions"]>}`)
				| `${resourceName}:*`
				| `${resourceName}.*`;
	  }[Extract<keyof TResources, string>]
	| `${OwnableWildcardActionPaths<TResources>}.own`;

type MergeRuleCtx<A extends RuleCtx, B extends RuleCtx> = {
	subject: A["subject"] extends UnsetMarker ? B["subject"] : A["subject"];
	object: A["object"] extends UnsetMarker
		? B["object"]
		: A["object"] extends OptionalMarker
			? MakeOptional<B["object"]>
			: A["object"];
};

type ResolveAction<TParentCtx extends RuleCtx, TAction extends Action<any, any>> =
	TAction extends Action<infer TName, infer TActionContext>
		? Action<
				TName,
				Expand<{
					ctx: Expand<MergeRuleCtx<TActionContext["ctx"], TParentCtx>>;
					configurable: TActionContext["configurable"];
				}>
			>
		: never;

type IndexActionGroupWithPath<
	TPath extends string,
	TActionGroup extends ActionGroup<any, any>,
	TParentCtx extends RuleCtx
> = TPath extends keyof TActionGroup["actions"] // Check fast path first
	? ResolveAction<TParentCtx, TActionGroup["actions"][TPath]>
	: TPath extends `${infer ActionGroupName}.${infer Rest}`
		? TActionGroup["actions"][ActionGroupName] extends ActionGroup<any, infer TActionGroupContext>
			? IndexActionGroupWithPath<
					Rest,
					TActionGroup["actions"][ActionGroupName],
					MergeRuleCtx<TActionGroupContext["ctx"], TParentCtx>
				>
			: never
		: TPath extends `${infer ActionGroupName}:${infer ActionName}`
			? TActionGroup["actions"][ActionGroupName] extends ActionGroup<any, any>
				? ResolveAction<TParentCtx, TActionGroup["actions"][ActionGroupName]["actions"][ActionName]>
				: never
			: never;

type IndexResourceWithPath<
	TPath extends string,
	TResource extends Resource<any, any>,
	TParentCtx extends RuleCtx
> = TPath extends keyof TResource["actions"] // Check fast path first
	? TResource["actions"][TPath] extends Action<any, any>
		? ResolveAction<TParentCtx, TResource["actions"][TPath]>
		: never
	: TPath extends `${infer ResourceOrGroupName}.${infer Rest}`
		? ResourceOrGroupName extends keyof TResource["actions"]
			? TResource["actions"][ResourceOrGroupName] extends ActionGroup<
					any,
					infer TActionGroupContext
				>
				? IndexActionGroupWithPath<
						Rest,
						TResource["actions"][ResourceOrGroupName],
						MergeRuleCtx<TActionGroupContext["ctx"], TParentCtx>
					>
				: never
			: TResource["subResources"][ResourceOrGroupName] extends Resource<any, infer TResourceContext>
				? IndexResourceWithPath<
						Rest,
						TResource["subResources"][ResourceOrGroupName],
						MergeRuleCtx<TResourceContext["ctx"], TParentCtx>
					>
				: never
		: TPath extends `${infer ResourceOrGroupName}:${infer ActionName}`
			? TResource["actions"][ResourceOrGroupName] extends ActionGroup<
					any,
					infer TActionGroupContext
				>
				? ResolveAction<
						MergeRuleCtx<TActionGroupContext["ctx"], TParentCtx>,
						TResource["actions"][ResourceOrGroupName]["actions"][ActionName]
					>
				: TResource["subResources"][ResourceOrGroupName] extends Resource<
							any,
							infer TResourceContext
					  >
					? ResolveAction<
							MergeRuleCtx<TResourceContext["ctx"], TParentCtx>,
							TResource["subResources"][ResourceOrGroupName]["actions"][ActionName]
						>
					: never
			: never;

export type ActionFromPath<
	TResources extends ResourceMap,
	TPath extends string
> = TPath extends `${infer TActualPath}.own`
	? ActionFromPath<TResources, TActualPath>
	: TPath extends `${infer ResourceName extends Extract<keyof TResources, string>}.${infer Rest}`
		? TResources[ResourceName] extends Resource<any, infer TResourceContext>
			? IndexResourceWithPath<Rest, TResources[ResourceName], TResourceContext["ctx"]>
			: never
		: TPath extends `${infer ResourceName extends Extract<keyof TResources, string>}:${infer ActionName}`
			? TResources[ResourceName] extends Resource<any, infer TResourceContext>
				? ResolveAction<TResourceContext["ctx"], TResources[ResourceName]["actions"][ActionName]>
				: never
			: never;

type ActionPathsWithAction<TResources extends ResourceMap, TPaths extends string> = {
	[path in TPaths]: {
		path: path;
		action: ActionFromPath<TResources, path>;
	};
}[TPaths];

export type FilterActionPaths<
	TResources extends ResourceMap,
	TCtxPattern,
	TConfigurable extends boolean = boolean,
	TPathsAndActions = ActionPathsWithAction<TResources, ActionPaths<TResources>>
> = TPathsAndActions extends { path: string; action: Action<any, infer TActionContext> }
	? TActionContext["ctx"] extends TCtxPattern
		? TActionContext["configurable"] extends TConfigurable
			? TPathsAndActions["path"]
			: never
		: never
	: never;
