export type Ok<TValue> = {
	ok: true;
	value: TValue;
};

export type None = Ok<null>;

export function ok<TValue>(value: TValue): Ok<TValue> {
	return { ok: true, value };
}

export const NONE = ok(null) as None;
