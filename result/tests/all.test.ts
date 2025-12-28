import { describe, it, expect } from "vitest";
import { Result } from "../src";

describe("All tests", () => {
	describe("Result.all()", () => {
		it("should return all ok values", () => {
			const results = [Result.ok(1), Result.ok(2), Result.ok(3), Result.ok("foo"), Result.ok(true)];

			const result = Result.all(...results);

			expect(result.ok).toBeTruthy();
			expect(result.value).toEqual([1, 2, 3, "foo", true]);
		});

		it("should return the first error value", () => {
			const firstError = Result.err("ERROR");
			const results = [
				Result.ok(1),
				Result.ok(2),
				firstError,
				Result.ok(3),
				Result.ok("foo"),
				Result.err("ANOTHER_ERROR"),
				Result.ok(true)
			];

			const result = Result.all(...results);

			expect(result).toEqual(firstError);
		});
	});

	describe("Result.allAsync()", () => {
		it("should return all ok values", async () => {
			const results = [
				Result.ok(1),
				Promise.resolve(Result.ok(2)),
				Result.ok(3),
				Promise.resolve(Result.ok("foo")),
				Result.ok(true)
			];

			const result = await Result.allAsync(...results);

			expect(result.ok).toBeTruthy();
			expect(result.value).toEqual([1, 2, 3, "foo", true]);
		});

		it("should return the first error value", async () => {
			const firstError = Result.err("ERROR");
			const results = [
				Promise.resolve(Result.ok(1)),
				Promise.resolve(Result.ok(2)),
				Promise.resolve(firstError),
				Result.ok(3),
				Promise.resolve(Result.ok("foo")),
				Result.err("ANOTHER_ERROR"),
				Result.ok(true)
			];

			const result = await Result.allAsync(...results);

			expect(result).toEqual(firstError);
		});
	});

	describe("Result.allValues()", () => {
		it("should return just the ok values", () => {
			const results = [
				Result.ok(1),
				Result.ok(2),
				Result.err("ERROR"),
				Result.ok(3),
				Result.ok("foo"),
				Result.err("ANOTHER_ERROR"),
				Result.ok(true)
			];

			const values = Result.allValues(...results);

			expect(values).toEqual([1, 2, 3, "foo", true]);
		});
	});

	describe("Result.allErrors()", () => {
		it("should return just the err results", () => {
			const firstError = Result.err("ERROR");
			const secondError = Result.err("ANOTHER_ERROR");
			const results = [
				Result.ok(1),
				Result.ok(2),
				firstError,
				Result.ok(3),
				Result.ok("foo"),
				secondError,
				Result.ok(true)
			];

			const errors = Result.allErrors(...results);

			expect(errors).toEqual([firstError, secondError]);
		});
	});
});
