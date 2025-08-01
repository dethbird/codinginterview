# Strict Null Checks (Cheatsheet)

## Overview

`strictNullChecks` is a TypeScript compiler option that makes handling `null` and `undefined` more precise and safer.

------

## Behavior Without `strictNullChecks`

- `null` and `undefined` are assignable to anything.

```ts
let name: string = null; // Allowed without strictNullChecks
```

------

## Behavior With `strictNullChecks`

- `null` and `undefined` must be handled explicitly.

```ts
let name: string = null; // Error
let maybeName: string | null = null; // OK
```

------

## Checking for Null and Undefined

```ts
function greet(name: string | null | undefined) {
  if (name != null) { // Checks for both null and undefined
    console.log(name.toUpperCase());
  }
}
```

------

## Optional Chaining and Nullish Coalescing

- Optional chaining `?.` safely accesses properties.

```ts
const street = user.address?.street;
```

- Nullish coalescing `??` provides fallback values.

```ts
const displayName = name ?? "Guest";
```

------

## Non-null Assertion Operator

```ts
const input = document.getElementById("input")!;
console.log(input.value);
```

Tells TypeScript the value is definitely not null or undefined (use carefully).

------

## Interview Tips

- Understand how strict null checks improve safety.
- Know how to handle null and undefined properly.
- Be comfortable using optional chaining and nullish coalescing.

