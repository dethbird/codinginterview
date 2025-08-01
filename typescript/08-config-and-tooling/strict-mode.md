# Strict Mode

## Overview

`strict` mode in TypeScript enables a set of type-checking options that improve code safety and correctness by enforcing stricter rules.

------

## Enabled by `"strict": true`

This umbrella flag enables:

- `noImplicitAny` — Errors on expressions with an implicit `any` type.
- `strictNullChecks` — Requires explicit handling of `null` and `undefined`.
- `strictFunctionTypes` — Checks function parameter bivariance for safer callbacks.
- `strictBindCallApply` — Checks `bind`, `call`, and `apply` methods more strictly.
- `strictPropertyInitialization` — Ensures class properties are initialized properly.
- `noImplicitThis` — Errors on unsafe `this` usages.
- `alwaysStrict` — Parses files in strict mode.

------

## Example Effects

### Without strictNullChecks

```ts
let name: string = null; // Allowed if strictNullChecks is false
```

### With strictNullChecks

```ts
let name: string = null; // Error: Type 'null' is not assignable to type 'string'
```

------

## Benefits

- Catches potential runtime errors at compile time.
- Makes type inference more precise.
- Encourages better coding practices.

------

## Interview Tips

- Understand what `"strict": true` enables.
- Be ready to explain why strict mode is recommended.
- Know some common errors caught by strict mode.

