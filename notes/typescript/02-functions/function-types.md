# Function Types

## Overview

Function types specify the types of parameters and the return type, enabling strong typing for functions, callbacks, and variables holding functions.

------

## Basic Function Declaration

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

- Parameters `a` and `b` are numbers.
- Function returns a number.

------

## Function Type Annotation for Variables

```ts
let multiply: (x: number, y: number) => number;

multiply = (a, b) => a * b;
```

- The variable `multiply` must be a function taking two numbers and returning a number.
- Useful for callbacks and higher-order functions.

------

## Void Return Type

```ts
function logMessage(msg: string): void {
  console.log(msg);
}
```

- `void` means the function does not return a value.

------

## Using Type Aliases for Functions

```ts
type BinaryOperation = (a: number, b: number) => number;

const subtract: BinaryOperation = (x, y) => x - y;
```

------

## Example: Callback Function

```ts
function filterArray(arr: number[], predicate: (num: number) => boolean): number[] {
  return arr.filter(predicate);
}

const evens = filterArray([1, 2, 3, 4], (n) => n % 2 === 0);
```

------

## Interview Tips

- Know how to declare function parameter and return types.
- Understand function type syntax for variables and callbacks.
- Be able to explain `void` return type and when to use it.

