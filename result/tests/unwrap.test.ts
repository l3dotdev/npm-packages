import { describe, it, expect, expectTypeOf } from "vitest";
import { Result, type Err, type Ok } from "../src";

describe("Unwrap tests", () => {
	describe("Result.unwrap()", () => {
		it("should return the same ok result", () => {
			const result = Result.ok(1);

			expect(Result.unwrap(result)).toEqual(result);
		});

		it("should be able to unwrap a result with a null value", () => {
			const result = Result.ok(null);

			expect(Result.unwrap(result)).toEqual(result);
		});

		it("should return the same err result", () => {
			const result = Result.err("ERROR");

			expect(Result.unwrap(result)).toEqual(result);
		});

		it("should return the deep ok result", () => {
			const deepResult = Result.ok(1);
			const result = Result.ok(Result.ok(deepResult));

			expect(Result.unwrap(result)).toEqual(deepResult);
		});

		it("should return the deep err result", () => {
			const deepResult = Result.err("ERROR");
			const result = Result.ok(Result.ok(deepResult));

			expect(Result.unwrap(result)).toEqual(deepResult);
		});

		it("should resolve the correct unwrapped type", () => {
			const results = [
				Result.err("TOP_LEVEL_ERROR"),
				Result.ok(Result.ok(Result.ok(Result.err("DEEPLY_NESTED_ERROR")))),
				Result.ok(
					Result.err("NESTED_ERROR_WITH_CONTEXT", {
						error: "Something went wrong!"
					})
				),
				Result.ok(1)
			];

			const result = Result.unwrap(results[0]);

			expectTypeOf(result).toExtend<
				| Ok<number>
				| Err<"TOP_LEVEL_ERROR", null>
				| Err<"DEEPLY_NESTED_ERROR", null>
				| Err<"NESTED_ERROR_WITH_CONTEXT", { error: string }>
			>();
		});
	});

	describe("Result.unwrapOrDefault()", () => {
		it("should return ok result value", () => {
			const result = Result.ok(1);

			expect(Result.unwrapOrDefault(result, 0)).toBe(1);
		});

		it("should return default value", () => {
			const result = Result.err("ERROR");

			expect(Result.unwrapOrDefault<typeof result, number>(result, 0)).toBe(0);
		});
	});
});
