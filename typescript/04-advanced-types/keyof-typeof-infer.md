# keyof, typeof, and infer

## Overview

These TypeScript keywords help manipulate and extract types dynamically, enabling advanced type programming.

------

## `keyof`

- Extracts the keys of an object type as a union of string literal types.

```ts
type User = { id: number; name: string; active: boolean };
type UserKeys = keyof User; // "id" | "name" | "active"
```

Useful for creating types that depend on object keys.

------

## `typeof`

- When used in types, extracts the **type of a value or variable**.

```ts
const user = { id: 1, name: "Alice" };
type UserType = typeof user; // { id: number; name: string; }
```

------

## `infer`

- Used in conditional types to infer a type within a type expression.

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = (x: number) => string;
type Result = ReturnType<Fn>; // string
```

------

## Examples Combining Them

```ts
// Extract keys of a type
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Alice" };
const userName = getProperty(user, "name"); // string

// Using typeof for type extraction
const person = { age: 25, city: "NY" };
type PersonType = typeof person;

// Using infer to get parameter types
type Params<T> = T extends (...args: infer P) => any ? P : never;

type Func = (a: number, b: string) => void;
type FuncParams = Params<Func>; // [number, string]
```

------

## Interview Tips

- Understand how to use `keyof` to work with keys.
- Know `typeof` to get types from values.
- Be able to explain `infer` in conditional types for type extraction.

