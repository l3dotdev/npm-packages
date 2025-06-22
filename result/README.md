# result

## Description

A `Result` based error handling library. Inspired by Rust's `Result` type and [neverthrow](https://www.npmjs.com/package/neverthrow).

This package aims to simplify neverthrow's API while still offering the result type-safety.

## Installation

```bash
npm install @l3dev/result
```

```bash
pnpm add @l3dev/result
```

## Documentation

### `ok`

Creates an `Ok` object, alias: `Result.ok`

```ts
ok<T>(value: T): Ok<T>
```

#### Example

```ts
import { ok } from "@l3dev/result";

const result = ok(42);

result.ok; // true
result.value; // 42
```

> Use `NONE` for a void ok result: `Ok<void>`

### `err`

Create an `Err` object, alias: `Result.err`

```ts
err<T>(type: T): Err<T, null>
err<T, D>(type: T, context: D): Err<T, D>
```

#### Example

```ts
import { err } from "@l3dev/result";

const result = err("error");

result.ok; // false
result.type; // 'error'
result.context; // null

const resultWithContext = err("error", { message: "Something went wrong" });

result.ok; // false
result.type; // 'error'
result.context; // { message: 'Something went wrong' }
```

### `Result.isOk`

Returns `true` if the result is an `Ok` object

```ts
isOk(result: ReturnResult<any, any>): boolean
```

### `Result.isErr`

Returns `true` if the result is an `Err` object

```ts
isErr(result: ReturnResult<any, any>): boolean
```

### `Result.fn`

Wraps a function requiring that the ReturnType be a `ReturnResult` type.

```ts
fn<T, F extends (...) => T>(fn: F): F
```

#### Example

```ts
import { ok, err, Result } from "@l3dev/result";

const myFunction = Result.fn((roll: number) => {
	if (roll < 1 || roll > 6) {
		return err("Invalid roll");
	}
	return ok(roll);
});

const result = myFunction(3); // Ok<3> | Err<"Invalid roll", null>
```

### `Result.fromPromise`

Catches any errors thrown by a promise into `Err` objects.

```ts
fromPromise<T>(promise: T): Promise<ReturnResult<Awaited<T>, ResultErrorDefinition<null, { error: TError }>>>
```

### `Result.unwrapOrDefault`

Unwraps the result, returning the value if it is an `Ok` object, or the default value if it is an `Err` object.

```ts
unwrapOrDefault<T>(result: ReturnResult<T, any>, defaultValue: T): T
```
