# Utility Types

## Overview

TypeScript provides built-in utility types to transform and manipulate existing types for common use cases.

------

## Common Utility Types

| Utility Type     | Description                                        | Example                  |
| ---------------- | -------------------------------------------------- | ------------------------ |
| `Partial<T>`     | Makes all properties optional                      | `Partial<User>`          |
| `Required<T>`    | Makes all properties required                      | `Required<User>`         |
| `Readonly<T>`    | Makes all properties readonly                      | `Readonly<User>`         |
| `Pick<T, K>`     | Selects a subset of properties                     | `Pick<User, "id"         |
| `Omit<T, K>`     | Omits specified properties                         | `Omit<User, "password">` |
| `Record<K, T>`   | Creates a type with keys `K` and values `T`        | `Record<string, number>` |
| `Exclude<T, U>`  | Excludes types from `T` that are assignable to `U` | `Exclude<"a"             |
| `Extract<T, U>`  | Extracts types from `T` assignable to `U`          | `Extract<"a"             |
| `NonNullable<T>` | Removes `null` and `undefined` from `T`            | `NonNullable<string      |

------

## Examples

```ts
type User = {
  id: number;
  name: string;
  email?: string;
  password?: string;
};

// Partial makes properties optional
type UpdateUser = Partial<User>;

// Required makes all properties required
type FullUser = Required<User>;

// Readonly makes properties immutable
type ReadonlyUser = Readonly<User>;

// Pick selects specified keys
type UserPreview = Pick<User, "id" | "name">;

// Omit excludes specified keys
type UserWithoutPassword = Omit<User, "password">;

// Record example: map of user IDs to names
type UserMap = Record<number, string>;

// Exclude example
type Letters = "a" | "b" | "c";
type NoAorC = Exclude<Letters, "a" | "c">;  // "b"

// Extract example
type OnlyAorC = Extract<Letters, "a" | "c">; // "a" | "c"
```

------

## Interview Tips

- Be familiar with these common utilities and their purpose.
- Use them to write concise and reusable type transformations.
- Understand how to combine utilities for complex typing.

