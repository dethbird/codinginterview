# Null and Undefined Checks

## Overview

Handling `null` and `undefined` safely is important in TypeScript, especially with strict null checks enabled (`--strictNullChecks`).

------

## Strict Null Checking

- With `--strictNullChecks`, `null` and `undefined` are **not** assignable to other types unless explicitly allowed.
- Forces explicit handling of these cases, improving safety.

```ts
let name: string = null;       // Error
let maybeName: string | null = null; // OK
```

------

## Checking for Null and Undefined

Use explicit checks to narrow types:

```ts
function greet(name: string | null | undefined) {
  if (name != null) {  // Checks both null and undefined
    console.log(`Hello, ${name.toUpperCase()}`);
  } else {
    console.log("Hello, stranger");
  }
}
```

------

## Optional Chaining (`?.`)

Safely access properties or call methods when value may be nullish:

```ts
const user = { name: "Alice", address: null };

console.log(user.address?.street); // undefined, no error
```

------

## Nullish Coalescing (`??`)

Provide a fallback when value is `null` or `undefined`:

```ts
let input: string | null = null;
const output = input ?? "default value"; // "default value"
```

------

## Non-null Assertion Operator (`!`)

Tell TypeScript a value is definitely not null or undefined (use cautiously):

```ts
const input = document.getElementById("myInput")!;
console.log(input.value);
```

------

## Interview Tips

- Understand how `--strictNullChecks` changes type checking.
- Know how to use explicit null checks, optional chaining, and nullish coalescing.
- Use non-null assertions sparingly and carefully.

