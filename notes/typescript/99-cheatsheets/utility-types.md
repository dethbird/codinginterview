# Utility Types (Cheatsheet)

## Overview

Common built-in utility types help manipulate and transform types easily.

------

## Partial

Makes all properties optional.

```ts
type PartialUser = Partial<User>;
```

------

## Required

Makes all properties required.

```ts
type RequiredUser = Required<User>;
```

------

## Readonly

Makes all properties readonly.

```ts
type ReadonlyUser = Readonly<User>;
```

------

## Pick

Selects a subset of properties.

```ts
type UserName = Pick<User, "name" | "email">;
```

------

## Omit

Excludes specified properties.

```ts
type UserWithoutPassword = Omit<User, "password">;
```

------

## Record

Creates a type with keys of one type and values of another.

```ts
type UserMap = Record<number, string>;
```

------

## Exclude

Excludes types from a union.

```ts
type Letters = "a" | "b" | "c";
type NoAorC = Exclude<Letters, "a" | "c">;  // "b"
```

------

## Extract

Extracts types from a union.

```ts
type OnlyAorC = Extract<Letters, "a" | "c">;  // "a" | "c"
```

------

## NonNullable

Removes `null` and `undefined`.

```ts
type NonNullString = NonNullable<string | null | undefined>;  // string
```

------

## Interview Tips

- Know these utilities for transforming types.
- Use them to avoid verbose manual typings.
- Practice combining utilities for complex scenarios.

