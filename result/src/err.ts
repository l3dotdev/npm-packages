export type Err<TType, TContext> = {
	ok: false;
	type: TType;
	context: TContext;
};

export function err<const TType>(type: TType): Err<TType, null>;
export function err<const TType, TContext>(type: TType, context: TContext): Err<TType, TContext>;
export function err<const TType, TContext>(
	type: TType,
	context?: TContext
): Err<TType, TContext | null> {
	return { ok: false, type, context: context ?? null };
}
