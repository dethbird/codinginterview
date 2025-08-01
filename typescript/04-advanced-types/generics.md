# Generics

## Overview

Generics enable writing reusable, type-safe components and functions that work with a variety of types while preserving type information.

------

## Basic Generic Function

```ts
function identity<T>(arg: T): T {
  return arg;
}

const num = identity<number>(42);     // Type is number
const str = identity<string>("hello"); // Type is string
```

- `<T>` declares a generic type parameter.
- The function works with any type, preserving type information.

------

## Generic with Inference

TypeScript can often infer the generic type:

```ts
const num = identity(42);      // Inferred as number
const str = identity("hello"); // Inferred as string
```

------

## Generic Interfaces and Types

```ts
interface Box<T> {
  value: T;
}

const box: Box<string> = { value: "contents" };
```

------

## Generic Classes

```ts
class KeyValuePair<K, V> {
  constructor(public key: K, public value: V) {}
}

const pair = new KeyValuePair<number, string>(1, "one");
```

------

## Constraints on Generics

Limit types to those that have specific properties or capabilities.

```ts
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("Hello");     // Works, string has length
logLength([1, 2, 3]);  // Works, array has length
// logLength(10);       // Error, number has no length
```

------

## Generic Defaults

You can provide default types for generics:

```ts
function createArray<T = string>(length: number, value: T): T[] {
  return new Array(length).fill(value);
}

const arr = createArray(3, "hello");  // string[]
```

------

## Interview Tips

- Understand generic syntax and usage.
- Know how to constrain generics.
- Be able to explain inference and default generic types.
- Use generics for reusable components, data structures, and functions.

