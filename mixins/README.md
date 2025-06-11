## Mixins

### `String.prototype.toTitleCase`

Converts the first letter of a string to uppercase and the rest to lowercase.

```ts
"hello world".toTitleCase(); // "Hello world"
```

### `String.prototype.toSlug`

Converts a string to a slug

```ts
"Hello World ".toSlug(); // "hello-world"
```

### `Number.prototype.toBytesString`

Converts a number of bytes to a human-readable string.

```ts
(1024).toBytesString(); // "1 KB"
```

### `Number.prototype.toDurationComponents`

Converts a number of milliseconds to individual components of a duration.

```ts
const hour = 1000 * 60 * 60;
const minute = 1000 * 60;
const duration = hour + minute * 27 + 5050;

const components = duration.toDurationComponents();
components; // { days: 0, hours: 1, minutes: 27, seconds: 5, milliseconds: 50 }
```

### `Number.prototype.toDuration`

Converts a number of milliseconds to a human-readable duration string.

```ts
const oneHour = 1000 * 60 * 60;
oneHour.toDuration(); // "1 hour"

const oneDayAnd30Seconds = 1000 * 60 * 60 * 24 + 30 * 1000;
oneDayAnd30Seconds.toDuration(); // "1 day 30 seconds"
```

### `Date.prototype.toRelativeString`

Creates a human-readable string representing the relative time between two dates.

```ts
const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
inOneHour.toRelativeString(); // "in 1 hour"

const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
yesterday.toRelativeString(); // "Yesterday"
```

### `Date.prototype.isToday`

Checks if a date is today.

```ts
const today = new Date();
today.isToday(); // true
```

### `Date.prototype.isTomorrow`

Checks if a date is tomorrow.

```ts
const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
tomorrow.isTomorrow(); // true
```

### `Date.prototype.isYesterday`

Checks if a date is yesterday.

```ts
const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
yesterday.isYesterday(); // true
```

### `RegExp.escape`

Escapes a string for use in a regular expression.

```ts
RegExp.escape("www.google.com/?q=hello+world"); // "www\.google\.com\/\?q=hello\+world"
```
