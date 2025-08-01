# Primitive Types

## Overview

TypeScript provides built-in primitive types that correspond to JavaScript primitives but with static typing. These are the foundation of most variable declarations.

## Basic Primitive Types

| Type        | Description                        | Example              |
| ----------- | ---------------------------------- | -------------------- |
| `string`    | Text data                          | `"hello"`, `'world'` |
| `number`    | Numeric values (integer, float)    | `42`, `3.14`, `-1`   |
| `boolean`   | True or false values               | `true`, `false`      |
| `null`      | Explicit absence of value          | `null`               |
| `undefined` | Variable declared but not assigned | `undefined`          |
| `bigint`    | Large integers (ES2020)            | `9007199254740991n`  |
| `symbol`    | Unique identifiers                 | `Symbol("id")`       |

## Examples

```ts
let username: string = "Alice";
let age: number = 30;
let isActive: boolean = true;

let userId: bigint = 9007199254740991n;
let uniqueKey: symbol = Symbol("userKey");

let nothing: null = null;
let notAssigned: undefined = undefined;
```

## Type Inference and Annotations

TypeScript often infers types without explicit annotations:

```ts
let greeting = "Hello";  // inferred as string
let score = 100;         // inferred as number
```

Explicit annotations improve readability and help prevent accidental type changes.

## Special Types: `any` and `unknown`

- `any`: disables type checking and should be avoided if possible.

```ts
let something: any = "could be anything";
something = 42;
```

- `unknown`: safer alternative; requires type narrowing before usage.

```ts
let input: unknown = "hello";

if (typeof input === "string") {
  console.log(input.toUpperCase());
}
```

## Interview Tips

- Prefer `string`, `number`, and `boolean` for common cases.
- Avoid `any` unless absolutely necessary.
- Use `unknown` for truly dynamic types with safe type checking.
- Know that `null` and `undefined` are distinct types when `strictNullChecks` is enabled.

------

Ready for **Arrays and Tuples** next?
