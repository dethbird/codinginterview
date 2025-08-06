# Common Gotchas in TypeScript

## Overview

Be aware of common pitfalls in TypeScript to avoid bugs and confusing errors during development and interviews.

------

## 1. Excess Property Checks

- Object literals assigned to types/interfaces reject unknown properties.

```ts
type User = { id: number; name: string };

const user: User = {
  id: 1,
  name: "Alice",
  age: 30, // Error: Object literal may only specify known properties.
};
```

**Workaround:** Use a type assertion or assign object to a variable first.

------

## 2. Structural Typing Confusion

- Types are compatible based on structure, not nominal typing.

```ts
type A = { x: number };
type B = { x: number; y: number };

let a: A = { x: 5 };
let b: B = a; // Error: Property 'y' is missing in type 'A'
```

------

## 3. Optional Chaining and Nullish Coalescing Confusion

- `?.` and `??` are distinct operators; understand their behaviors.

------

## 4. Union Type Assignability

- Assigning union types can cause narrowing issues.

```ts
function example(x: string | number) {
  let y: string = x; // Error: Type 'string | number' is not assignable to 'string'.
}
```

------

## 5. Readonly Array Mutations

- Readonly arrays do not allow mutating methods.

```ts
const arr: readonly number[] = [1, 2, 3];
arr.push(4); // Error
```

------

## 6. Misuse of `any`

- Overusing `any` disables type safety and defeats TypeScript’s purpose.

------

## Interview Tips

- Highlight awareness of these common issues.
- Show how to avoid or fix them.
- Demonstrate understanding of TypeScript’s type system.

