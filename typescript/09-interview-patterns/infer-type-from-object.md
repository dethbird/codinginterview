# Infer Type From Object

## Overview

TypeScript’s `infer` keyword in conditional types allows extracting or inferring types from complex types, including objects.

------

## Example: Infer Return Type of Function

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = (x: number) => string;
type Result = ReturnType<Fn>; // string
```

------

## Inferring Type from Object Properties

Extract property types dynamically:

```ts
type ValueOf<T> = T[keyof T];

type User = { id: number; name: string };
type UserValue = ValueOf<User>; // number | string
```

------

## Inferring Keys or Nested Types

```ts
type NestedType<T> = T extends { nested: infer U } ? U : never;

type Example = { nested: { a: number } };
type Nested = NestedType<Example>; // { a: number }
```

------

## Interview Tips

- Understand how `infer` extracts types within conditional types.
- Use `keyof` combined with indexed access to extract property value types.
- Show practical examples of inferring types from functions and objects.

