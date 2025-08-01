# Function Syntax (Cheatsheet)

## Overview

Quick reference for declaring functions with TypeScript types.

------

## Function Declaration

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

------

## Function Expression

```ts
const multiply = function (a: number, b: number): number {
  return a * b;
};
```

------

## Arrow Function

```ts
const subtract = (a: number, b: number): number => a - b;
```

------

## Optional and Default Parameters

```ts
function greet(name: string, greeting?: string) {
  console.log(`${greeting ?? "Hello"}, ${name}!`);
}

function greetDefault(name: string, greeting: string = "Hello") {
  console.log(`${greeting}, ${name}!`);
}
```

------

## Rest Parameters

```ts
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}
```

------

## Function Overloads

```ts
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) {
    return new Date(y, mOrTimestamp, d);
  } else {
    return new Date(mOrTimestamp);
  }
}
```

------

## Interview Tips

- Know how to declare functions with typed parameters and return types.
- Understand optional, default, and rest parameters.
- Be familiar with function overloads for flexible APIs.

