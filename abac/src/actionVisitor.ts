import { Action } from "./action.js";
import type { ActionMap, ResourceMap } from "./internal/collections.js";
import type { ActionFromPath, ActionPaths } from "./internal/paths.js";
import type { Resource } from "./resource.js";

type VisitContext = { action: Action<any, any>; resource: Resource<any, any>; path: string };

type Callback = (ctx: VisitContext) => any;

type Predicate = (ctx: VisitContext) => boolean;

type Visit = (ctx: VisitContext) => void;

export class ActionVisitor<TResources extends ResourceMap> {
	private resources: TResources;
	private callback: Callback = () => {};
	private lastVisited: VisitContext | null = null;
	private stop: boolean = false;

	constructor(resources: TResources) {
		this.resources = resources;
	}

	public find(predicate: Predicate) {
		this.start(predicate);

		return this.stop ? this.lastVisited : null;
	}

	public findByPath<TActionPath extends ActionPaths<TResources>>(path: TActionPath) {
		const ctx = this.find(({ path: ctxPath }) => path === ctxPath);
		if (!ctx) {
			return null;
		}

		return {
			resource: ctx.resource,
			action: ctx.action as ActionFromPath<TResources, TActionPath>
		};
	}

	public traverse(visit: Visit) {
		this.start(visit);
	}

	private start(callback: Callback) {
		this.stop = false;
		this.callback = callback;

		this.traverseResources(this.resources);
	}

	private traverseResources(resources: ResourceMap, path?: string) {
		for (const [name, resource] of Object.entries(resources)) {
			if (this.stop) {
				break;
			}

			this.traverseResource(resource, path ? `${path}.${name}` : name);
		}
	}

	private traverseResource(resource: Resource<any, any>, path: string) {
		this.traverseActions(resource, resource.actions, path);
		this.traverseResources(resource.subResources, path);
	}

	private traverseActions(resource: Resource<any, any>, actions: ActionMap, path: string) {
		for (const [name, action] of Object.entries(actions)) {
			if (this.stop) {
				break;
			}

			if (action instanceof Action) {
				const ctx = { action, resource, path: `${path}:${name}` };
				this.lastVisited = ctx;

				const stop = this.callback(ctx);
				if (stop) {
					this.stop = true;
					break;
				}
			} else {
				this.traverseActions(resource, action.actions, `${path}.${name}`);
			}
		}
	}
}
