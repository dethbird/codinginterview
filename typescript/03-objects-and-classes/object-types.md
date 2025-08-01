# Object Types

## Overview

Object types in TypeScript define the shape of objects, specifying property names and their types.

------

## Basic Object Type

```ts
let user: { id: number; name: string; active: boolean };

user = {
  id: 1,
  name: "Alice",
  active: true,
};
```

------

## Optional Properties

Use `?` to mark properties optional.

```ts
type User = {
  id: number;
  name: string;
  age?: number; // optional
};

const user1: User = { id: 1, name: "Bob" };
const user2: User = { id: 2, name: "Carol", age: 25 };
```

------

## Readonly Properties

Use `readonly` to prevent reassignment.

```ts
type User = {
  readonly id: number;
  name: string;
};

const user: User = { id: 1, name: "Alice" };
// user.id = 2; // Error: Cannot assign to 'id' because it is a read-only property.
```

------

## Index Signatures

Define dynamic keys with specific types.

```ts
type StringMap = {
  [key: string]: string;
};

const translations: StringMap = {
  hello: "hola",
  goodbye: "adiós",
};
```

------

## Excess Property Checks

TypeScript warns if an object literal has properties not declared in the type:

```ts
type User = { id: number; name: string };
const user: User = { id: 1, name: "Alice", age: 30 }; // Error: Object literal may only specify known properties.
```

------

## Interview Tips

- Know how to declare object types with required and optional properties.
- Understand `readonly` and index signatures.
- Be aware of excess property checks and how to bypass with type assertions.

