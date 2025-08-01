# Mapped Types

## Overview

Mapped types allow you to create new types by transforming properties of an existing type. They iterate over keys of a type and apply modifiers or transformations.

------

## Basic Syntax

```ts
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

- `[P in keyof T]` iterates over all keys `P` in type `T`.
- You can add modifiers like `readonly` or make properties optional.

------

## Common Examples

### Making all properties readonly

```ts
type ReadonlyUser = {
  readonly [P in keyof User]: User[P];
};
```

Equivalent to built-in `Readonly<T>` utility type.

------

### Making all properties optional

```ts
type PartialUser = {
  [P in keyof User]?: User[P];
};
```

Equivalent to built-in `Partial<T>`.

------

### Mapping with modifiers

```ts
type NullableUser = {
  [P in keyof User]: User[P] | null;
};
```

------

## Using `as` to Remap Keys (TypeScript 4.1+)

You can rename keys:

```ts
type PrefixedUser = {
  [P in keyof User as `get${Capitalize<string & P>}`]: () => User[P];
};
```

Example output keys: `getId`, `getName`, etc.

------

## Interview Tips

- Understand the syntax of mapped types `[P in keyof T]`.
- Know how to add modifiers (`readonly`, optional).
- Be aware of key remapping with `as`.
- Use mapped types to create flexible, reusable type transformations.

