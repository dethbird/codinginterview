# Arrays and Tuples

## Overview

Arrays and tuples are collection types in TypeScript but differ in flexibility and the type of elements they hold.

------

## Arrays

- Arrays hold elements of the **same type**.
- Syntax options:

```ts
let numbers: number[] = [1, 2, 3];
let fruits: Array<string> = ["apple", "banana", "cherry"];
```

Both declarations are equivalent.

- You can create readonly arrays to prevent modification:

```ts
const readonlyNumbers: readonly number[] = [1, 2, 3];
// readonlyNumbers.push(4); // Error: push does not exist on readonly array
```

------

## Tuples

- Tuples are fixed-length arrays with **specific types for each position**.
- Useful for representing fixed sets of mixed types.

```ts
let user: [number, string] = [1, "Alice"];
// user[0] is number, user[1] is string
```

- Accessing elements beyond the defined length causes a TypeScript error:

```ts
user[2]; // Error: Tuple type '[number, string]' of length '2' has no element at index '2'.
```

- Tuples can have optional and rest elements (TypeScript 4.x+):

```ts
let flexibleTuple: [number, string?, ...boolean[]] = [42];
flexibleTuple = [42, "optional", true, false];
```

------

## Common Operations

```ts
let colors: string[] = ["red", "green", "blue"];
colors.push("yellow");

let coords: [number, number] = [10, 20];
// coords.push(30); // Allowed but usually discouraged; tuples are fixed size
```

------

## When to Use Which?

| Use Case                               | Choose |
| -------------------------------------- | ------ |
| List of same-type elements             | Array  |
| Fixed-length collection of mixed types | Tuple  |

------

## Example

```ts
// Array of user IDs
const userIds: number[] = [1, 2, 3];

// Tuple for user record with ID and name
const userRecord: [number, string] = [1, "Alice"];
```

------

## Interview Tips

- Know tuple syntax and how it differs from arrays.
- Understand when to use fixed-length tuples vs flexible arrays.
- Use readonly arrays/tuples for immutability when needed.

