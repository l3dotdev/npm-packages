import { z, type ZodTypeAny } from "zod/v3";

import type { Err } from "../err.js";
import type { Ok } from "../ok.js";

export const OkSchema = z.object({
	ok: z.literal(true),
	value: z.any()
} satisfies Record<keyof Ok<any>, ZodTypeAny>);

export const ErrSchema = z.object({
	ok: z.literal(false),
	type: z.any(),
	context: z.any()
} satisfies Record<keyof Err<any, any>, ZodTypeAny>);

export const ReturnResultSchema = z.union([OkSchema, ErrSchema]);
