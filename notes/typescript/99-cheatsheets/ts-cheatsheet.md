# TypeScript Cheatsheet

## Overview

A quick reference for common TypeScript syntax and features to keep handy during interviews.

------

## Basic Types

```ts
let isDone: boolean = false;
let age: number = 30;
let name: string = "Alice";
let list: number[] = [1, 2, 3];
let tuple: [string, number] = ["hello", 10];
```

------

## Functions

```ts
function add(a: number, b: number): number {
  return a + b;
}

const subtract = (a: number, b: number): number => a - b;
```

------

## Interfaces and Types

```ts
interface User {
  id: number;
  name: string;
}

type Status = "success" | "error";
```

------

## Classes

```ts
class Person {
  constructor(public name: string) {}

  greet() {
    return `Hello, ${this.name}`;
  }
}
```

------

## Generics

```ts
function identity<T>(arg: T): T {
  return arg;
}

const num = identity<number>(42);
```

------

## Utility Types (Partial, Pick, Omit)

```ts
type PartialUser = Partial<User>;
type UserName = Pick<User, "name">;
type UserWithoutId = Omit<User, "id">;
```

------

## Nullable Types and Guards

```ts
function printLength(s: string | null) {
  if (s != null) {
    console.log(s.length);
  }
}
```

------

## Modules and Imports

```ts
import { MyClass } from "./myClass";
export function myFunc() {}
```

------

## Interview Tips

- Use this sheet to quickly recall syntax.
- Practice writing small snippets based on these patterns.
- Customize with your most common interview topics.

