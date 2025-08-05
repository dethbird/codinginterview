# Conditional Types

## Overview

Conditional types allow types to be defined based on a condition, similar to ternary expressions but for types.

------

## Basic Syntax

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
```

- The type evaluates to one type if the condition is true, another if false.

------

## Using Conditional Types with Generics

```ts
type ElementType<T> = T extends (infer U)[] ? U : T;

type StrArray = string[];
type StrElement = ElementType<StrArray>;  // string
type NumElement = ElementType<number>;    // number
```

- `infer` extracts a type variable from the condition.

------

## Distributive Conditional Types

Conditional types distribute over unions:

```ts
type ToArray<T> = T extends any ? T[] : never;

type StrOrNum = ToArray<string | number>; // string[] | number[]
```

------

## Example: NonNullable

Built-in type that excludes `null` and `undefined`:

```ts
type NonNullable<T> = T extends null | undefined ? never : T;

type A = NonNullable<string | null>;  // string
```

------

## Interview Tips

- Know syntax and purpose of conditional types.
- Understand `infer` usage inside conditionals.
- Recognize distributive conditional behavior on unions.
- Be able to explain built-in utility types using conditional types.

