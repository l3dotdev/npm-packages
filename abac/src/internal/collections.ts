import type { Action } from "../action.js";
import type { ActionGroup } from "../actionGroup.js";
import type { Resource } from "../resource.js";
import type { UnionToIntersection } from "./core.js";

export type ActionMap = Record<string, Action<any, any> | ActionGroup<any, any>>;

export type ToActionMap<TActions extends Action<any, any> | ActionGroup<any, any>> =
	UnionToIntersection<
		TActions extends Action<infer TName, any> | ActionGroup<infer TName, any>
			? {
					[name in TName]: TActions;
				}
			: never,
		ActionMap
	>;

export type ResourceMap = Record<string, Resource<any, any>>;

export type UnionToResourceMap<TResources extends Resource<any, any>> = UnionToIntersection<
	TResources extends Resource<infer TName, any>
		? {
				[name in TName]: TResources;
			}
		: never,
	ResourceMap
>;
