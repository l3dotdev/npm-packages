import { Action, type RuleCtx, type InferActionSubject } from "./action.js";
import { ActionGroup } from "./actionGroup.js";
import { ActionVisitor } from "./actionVisitor.js";
import type { ResourceMap, UnionToResourceMap } from "./internal/collections.js";
import type { UnsetMarker } from "./internal/core.js";
import type { IMeta } from "./internal/meta.js";
import type { ActionFromPath, ActionPaths, FilterActionPaths } from "./internal/paths.js";
import { Permission, type PermissionOptions } from "./permission.js";
import { Policy } from "./policy.js";
import { PolicyFilters } from "./policyFilters.js";
import { Resource } from "./resource.js";

export type ConfigurableAction = {
	path: string;
	action: Action<any, any>;
	own: boolean;
};

type ConfigurableActionGroup = {
	meta: IMeta;
	children: ConfigurableActionTreeNode[];
};

export type ConfigurableActionTreeNode = ConfigurableAction | ConfigurableActionGroup;

export class ABAC<TResources extends ResourceMap> {
	private _resourceMap: TResources;
	private _policies: Policy<TResources>[] = [];

	constructor(resourceMap: TResources) {
		this._resourceMap = resourceMap;
	}

	declare public $resources: TResources;
	declare public $actions: ActionPaths<TResources>;
	declare public $configurableActions: FilterActionPaths<TResources, any, true>;
	declare public $filterActions: <TCtx>() => FilterActionPaths<TResources, TCtx>;

	public getConfigurableActions() {
		const actions: ConfigurableAction[] = [];

		const visitor = new ActionVisitor(this._resourceMap);
		visitor.traverse(({ action, resource, path }) => {
			if (!action.configurable) {
				return;
			}

			actions.push({
				path,
				action,
				own: resource.ownable && resource.ownConfigurable && !action.noObject
			});
		});

		return actions;
	}

	public getConfigurableActionsTree() {
		const nodeMap = new Map<string, ConfigurableActionGroup>();
		const root = {
			children: []
		} as unknown as ConfigurableActionGroup;
		nodeMap.set("", root);

		const visitor = new ActionVisitor(this._resourceMap);
		visitor.traverse(({ action, resource, path, stack }) => {
			if (!action.configurable) {
				return;
			}

			let parent = root;
			if (stack.length) {
				let stackPath = "";
				for (const item of stack) {
					stackPath = `${stackPath}.${item.name}`;
					if (!nodeMap.has(stackPath)) {
						const node = {
							meta: item,
							children: []
						};
						parent.children.push(node);
						nodeMap.set(stackPath, node);
					}

					parent = nodeMap.get(stackPath)!;
				}
			}

			parent.children.push({
				path,
				action,
				own: resource.ownable && resource.ownConfigurable && !action.noObject
			});
		});

		return root.children;
	}

	public can<TActionPath extends ActionPaths<TResources>>(
		subject: InferActionSubject<ActionFromPath<TResources, TActionPath>>,
		path: TActionPath,
		options?: PermissionOptions<TActionPath, ActionFromPath<TResources, TActionPath>>
	) {
		const policies = this._policies.filter((policy) => policy.match({ subject }));

		const visitor = new ActionVisitor(this._resourceMap);

		const actionPath = path.endsWith(".own") ? path.slice(0, -4) : path;
		const result = visitor.findByPath(actionPath as TActionPath);
		if (!result) {
			throw new Error(`No action '${actionPath}' found in ABAC resource map`);
		}

		return Permission.create(subject, path, result.resource, result.action, policies, options);
	}

	public addPolicy(build: (policy: Policy<TResources>) => Policy<TResources>) {
		const policy = build(ABAC.createPolicy());
		this._policies.push(policy);
		return this;
	}

	public static create<TResource extends Resource<any, any>>(resources: TResource[]) {
		const resourceMap = resources.reduce(
			(map, resource) => ({
				...map,
				[resource.name]: resource
			}),
			{} as UnionToResourceMap<TResource>
		);

		return new ABAC(resourceMap);
	}

	public static createResource<TName extends string>(name: TName) {
		return new Resource<
			TName,
			{
				ctx: {
					subject: UnsetMarker;
					object: UnsetMarker;
				};
				actions: UnsetMarker;
				subResources: UnsetMarker;
				ownable: false;
			}
		>(name);
	}

	public static createAction<
		TName extends string,
		TCtx extends RuleCtx = { subject: UnsetMarker; object: UnsetMarker }
	>(name: TName) {
		return new Action<TName, { ctx: TCtx; configurable: false }>(name);
	}

	public static createActionGroup<
		TName extends string,
		TCtx extends RuleCtx = { subject: UnsetMarker; object: UnsetMarker }
	>(name: TName) {
		return new ActionGroup<
			TName,
			{
				ctx: TCtx;
				actions: UnsetMarker;
			}
		>(name);
	}

	public static createPolicy<TResources extends ResourceMap>() {
		return new Policy<TResources>();
	}

	public static Filter = PolicyFilters;
}
