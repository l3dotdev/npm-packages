## Description

An extension of [@l3dev/result](https://www.npmjs.com/package/@l3dev/result) for creating result shaped API responses.

Mainly to be used with @l3dev type-safe api libraries:

- [@l3dev/svelte-api](https://www.npmjs.com/package/@l3dev/svelte-api)

## Installation

```bash
npm install @l3dev/api-result
```

```bash
pnpm add @l3dev/api-result
```

## Documentation

### `ok`

Creates an `OkResponse` object, alias: `ApiResult.ok`

```ts
ok<T>(value: T): OkResponse<T, 200>
ok<T, S>(value: T, status: S): OkResponse<T, S>
```

#### Example

```ts
import { ok } from "@l3dev/api-result";

const result = ok({
	message: "Hello world"
});

result.ok; // true
result.value; // { message: "Hello world" }
result.status; // 200
```

> Use `EMPTY` as a shorthand for a 204 No Content response, it is equivalent to `OkResponse<null, 204>`

### `err`

Create an `ErrResponse` object, alias: `ApiResult.err`

```ts
err<T>(type: T): ErrResponse<T, null, 500>
err<T, S>(type: T, status: S): ErrResponse<T, null, S>
err<T, D>(type: T, context: D): ErrResponse<T, D, 500>
err<T, D, S>(type: T, context: D, status: S): ErrResponse<T, D, S>
```

#### Example

```ts
import { err } from "@l3dev/api-result";

const result = err("error");

result.ok; // false
result.type; // 'error'
result.context; // null
result.status; // 500

const resultNotFound = err("not found", 404);

resultNotFound.ok; // false
resultNotFound.type; // 'not found'
resultNotFound.status; // 404
```

### `Result.fromErr`

Convert an `Err` object into an `ErrResponse`

```ts
fromErr<T, D>(err: Err<T, D>): ErrResponse<T, D, 500>
fromErr<T, D, S>(err: Err<T, D>, status: S): ErrResponse<T, D, S>
```

### `redirect`

Create a `RedirectResponse` object, alias: `ApiResult.redirect`

```ts
redirect<T, S>(url: T, status: S): RedirectResponse<T, S>
```

#### Example

```ts
import { redirect } from "@l3dev/api-result";

const result = redirect("/home", 302);

result.ok; // true
result.redirect; // true
result.value; // { target: "/home" }
result.status; // 302
```

### `ApiResult.isOk`

Returns `true` if the result is an `OkResponse` object

```ts
isOk(result: ResponseResult<...>): boolean
```

### `ApiResult.isErr`

Returns `true` if the result is an `ErrResponse` object

```ts
isErr(result: ResponseResult<...>): boolean
```

### `ApiResult.isRedirect`

Returns `true` if the result is a `RedirectResponse` object

```ts
isRedirect(result: ResponseResult<...>): boolean
```
