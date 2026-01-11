export type UnsetMarker = "unset" & {
	__brand: "unsetMarker";
};

export type OptionalMarker = "optional" & {
	__brand: "optionalMarker";
};

export type MakeOptional<T> = T extends UnsetMarker ? OptionalMarker : T | undefined;

export type Expand<T> = T extends Record<any, any> ? { [K in keyof T]: T[K] } : never;

export type KeysEqual<A, B> =
	A extends Record<keyof B, any> ? (B extends Record<keyof A, any> ? true : false) : false;

export type UnionToIntersection<U, T> = (U extends any ? (k: U) => void : never) extends (
	k: infer I extends T
) => void
	? I
	: never;

export type OptionalUndefinedFields<T> = Expand<
	Partial<T> &
		Pick<
			T,
			{
				[K in keyof T]: T[K] extends Exclude<T[K], undefined> ? K : never;
			}[keyof T]
		>
>;

export type EmptyObject = { object: void };

export type IsOnlyEmptyObject<T> =
	KeysEqual<EmptyObject, T> extends true ? (T extends EmptyObject ? true : false) : false;

export type HasOnlyObject<T> = KeysEqual<{ object: any }, T>;
