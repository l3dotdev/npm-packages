/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
	Action,
	InferActionAdditionalContext,
	InferActionObject,
	InferActionRuleCtx,
	InferActionSubject,
	RuleCtx
} from "./action.js";
import type { ResourceMap } from "./internal/collections.js";
import type {
	EmptyObject,
	Expand,
	IsOnlyEmptyObject,
	OptionalUndefinedFields
} from "./internal/core.js";
import type { ActionFromPath } from "./internal/paths.js";
import { Specitivity, type Policy, type Rule } from "./policy.js";
import type { Resource } from "./resource.js";

type PermissionTestResult = {
	granted: boolean;
	specitivity: Specitivity;
	policy: Policy<any> | null;
	rule: Rule | null;
};

type Granted<
	TAction extends Action<any, any>,
	TCtx extends Omit<InferActionRuleCtx<TAction>, "subject"> = Omit<
		InferActionRuleCtx<TAction>,
		"subject"
	>
> =
	IsOnlyEmptyObject<TCtx> extends true
		? {
				granted(): boolean;
				test(): PermissionTestResult;
			}
		: {
				granted(
					ctx: OptionalUndefinedFields<TCtx extends EmptyObject ? Omit<TCtx, "object"> : TCtx>
				): boolean;
				test(
					ctx: OptionalUndefinedFields<TCtx extends EmptyObject ? Omit<TCtx, "object"> : TCtx>
				): PermissionTestResult;
			};

type Filter<
	TAction extends Action<any, any>,
	TObjects extends InferActionObject<TAction>[] = InferActionObject<TAction>[]
> =
	InferActionRuleCtx<TAction> extends EmptyObject
		? {}
		: InferActionAdditionalContext<TAction> extends {}
			? {
					filter(objects: TObjects): TObjects;
				}
			: {
					filter(
						objects: TObjects,
						ctx: OptionalUndefinedFields<InferActionAdditionalContext<TAction>>
					): TObjects;
				};

type ResolvedPermission<TActionPath extends string, TAction extends Action<any, any>> = Omit<
	Permission<TActionPath, TAction>,
	"granted" | "filter"
> &
	Granted<TAction> &
	Filter<TAction>;

export type PermissionCtx<
	TAction extends Action<any, any>,
	TCtx extends RuleCtx = InferActionRuleCtx<TAction>
> = TCtx extends EmptyObject ? Expand<Omit<TCtx, "object">> : Expand<TCtx>;

export type GrantedPermissionsResolver<
	TActionPath extends string,
	TAction extends Action<any, any>
> = (
	object: InferActionObject<TAction>,
	permission: ResolvedPermission<TActionPath, TAction>
) => string[] | Set<string>;

export type PermissionOptions<TActionPath extends string, TAction extends Action<any, any>> = {
	grantedPermissions?:
		| "all"
		| string[]
		| Set<string>
		| GrantedPermissionsResolver<TActionPath, TAction>;
	checkOwnership?: (ctx: InferActionRuleCtx<TAction>) => boolean;
};

const VoidObjectCacheKey = Symbol("void-object");

export class Permission<TActionPath extends string, TAction extends Action<any, any>> {
	private _subject: InferActionSubject<TAction>;
	private _path: TActionPath;
	private _resource: Resource<any, any>;
	private _action: TAction;
	private _policies: Policy<any>[];
	private _options: PermissionOptions<TActionPath, TAction>;

	private _grantedPermissionsCache: Map<any, Set<string>> = new Map();

	constructor(
		subject: InferActionSubject<TAction>,
		path: TActionPath,
		resource: Resource<any, any>,
		action: TAction,
		policies: Policy<any>[],
		options?: PermissionOptions<TActionPath, TAction>
	) {
		this._subject = subject;
		this._path = path;
		this._resource = resource;
		this._action = action;
		this._policies = policies;

		this._options = options ?? {};
	}

	public get path() {
		return this._path;
	}

	public get resource() {
		return this._resource;
	}

	public get action() {
		return this._action;
	}

	public get policies() {
		return this._policies;
	}

	public test(
		ctx?: OptionalUndefinedFields<Omit<InferActionRuleCtx<TAction>, "subject">>
	): PermissionTestResult {
		const fullCtx = {
			...(ctx ?? {}),
			subject: this._subject
		} as unknown as InferActionRuleCtx<TAction>;

		let granted = false;
		let specitivity = -1;
		let grantPolicy: Policy<any> | null = null;
		let grantRule: Rule | null = null;

		const ownsObject = this.checkOwnership(fullCtx);
		const isGranted =
			!this._action.configurable ||
			this.isGranted(this._path, fullCtx.object) ||
			(ownsObject && this.isGranted(this._path + ".own", fullCtx.object));

		for (const policy of this._policies) {
			for (const rule of policy.rules) {
				const match = Permission.matchPathPattern(this._path, rule.action);
				if (!match.matches || specitivity > match.specitivity) {
					continue;
				}

				const result = rule.predicate(fullCtx, this._action);
				granted = result === "ifgranted" ? isGranted : result;
				specitivity = rule.specitivity ?? match.specitivity;
				grantPolicy = policy;
				grantRule = rule;

				if (specitivity === Specitivity.Exact) {
					// This rule is an exact match, so we can stop and return early
					break;
				}
			}

			if (specitivity === Specitivity.Exact) break;
		}

		return {
			granted,
			specitivity,
			policy: grantPolicy,
			rule: grantRule
		};
	}

	public granted(ctx?: OptionalUndefinedFields<Omit<InferActionRuleCtx<TAction>, "subject">>) {
		const { granted } = this.test(ctx);
		return granted;
	}

	public filter(
		objects: InferActionObject<TAction>[],
		ctx?: InferActionAdditionalContext<TAction>
	) {
		return objects
			.map((object) => ({
				object,
				granted: this.granted({
					object,
					...(ctx ?? {})
				} as any)
			}))
			.filter(({ granted }) => granted)
			.map(({ object }) => object);
	}

	private isGranted(path: string, object: InferActionObject<TAction>) {
		if (this._options.grantedPermissions === "all") {
			return true;
		}

		const cacheKey: any = object ? object : VoidObjectCacheKey;
		let grantedPermissions: Set<string>;
		if (this._grantedPermissionsCache.has(cacheKey)) {
			grantedPermissions = this._grantedPermissionsCache.get(cacheKey)!;
		} else {
			if (typeof this._options.grantedPermissions === "function") {
				grantedPermissions = new Set(
					this._options.grantedPermissions(
						object,
						this as unknown as ResolvedPermission<TActionPath, TAction>
					)
				);
			} else {
				grantedPermissions = new Set(this._options.grantedPermissions ?? []);
			}

			this._grantedPermissionsCache.set(cacheKey, grantedPermissions);
		}

		return grantedPermissions.has(path);
	}

	private checkOwnership(ctx: InferActionRuleCtx<TAction>) {
		if (!this._resource.ownable) {
			return false;
		}

		if (typeof this._options.checkOwnership === "function") {
			return this._options.checkOwnership(ctx);
		}

		return false;
	}

	private static matchPathPattern(path: string, pattern: string) {
		if (pattern === "*") {
			// Any action
			return {
				matches: true,
				specitivity: Specitivity.Any
			};
		}

		if (pattern.endsWith(".*")) {
			// Any action, sub-resource or action group on this resource
			return {
				matches: path.startsWith(pattern.slice(0, -2)),
				specitivity: Specitivity.ActionsAndNested
			};
		}

		if (pattern.endsWith(":*")) {
			// Any action on this resource (excluding action groups)
			return {
				matches: path.startsWith(pattern.slice(0, -1)),
				specitivity: Specitivity.ActionsOnly
			};
		}

		if (pattern.endsWith(":*.own")) {
			return {
				matches: path.startsWith(pattern.slice(0, -6)) && path.endsWith(".own"),
				specitivity: Specitivity.OwnedActionsOnly
			};
		}

		// Specific action
		return {
			matches: path === pattern,
			specitivity: Specitivity.Exact
		};
	}

	public static create<
		TResources extends ResourceMap,
		TActionPath extends string,
		TAction extends Action<any, any> = ActionFromPath<TResources, TActionPath>
	>(
		subject: InferActionSubject<TAction>,
		path: TActionPath,
		resource: Resource<any, any>,
		action: TAction,
		policies: Policy<TResources>[],
		options?: PermissionOptions<TActionPath, TAction>
	) {
		return new Permission(
			subject,
			path,
			resource,
			action,
			policies,
			options
		) as unknown as ResolvedPermission<TActionPath, TAction>;
	}
}
