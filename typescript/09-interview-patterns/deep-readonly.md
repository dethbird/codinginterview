# Deep Readonly

## Overview

`DeepReadonly` is a utility type that recursively makes all properties of an object and its nested objects **readonly**, preventing any mutation at any depth.

------

## Why Use Deep Readonly?

- Enforce immutability deeply.
- Prevent accidental changes to nested structures.
- Useful in state management or immutable data patterns.

------

## Implementation Example

```ts
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

- For each property `P` in `T`, make it readonly.
- If `T[P]` is an object, recursively apply `DeepReadonly`.

------

## Usage Example

```ts
type User = {
  name: string;
  address: {
    street: string;
    city: string;
  };
};

const user: DeepReadonly<User> = {
  name: "Alice",
  address: {
    street: "123 Main St",
    city: "Wonderland",
  },
};

user.name = "Bob";             // Error: readonly
user.address.city = "Elsewhere"; // Error: readonly
```

------

## Interview Tips

- Understand recursive mapped types.
- Be able to write and explain `DeepReadonly`.
- Know when deep immutability is beneficial.

