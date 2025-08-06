# Class Syntax

## Overview

TypeScript extends JavaScript classes with type annotations and access modifiers for better structure and safety.

------

## Basic Class Declaration

```ts
class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `Hello, my name is ${this.name}`;
  }
}

const alice = new Person("Alice", 30);
console.log(alice.greet());
```

------

## Property Declaration

- Class properties must be declared with types.
- Properties can be initialized in constructor or directly:

```ts
class Person {
  name: string = "Unknown";
  age: number;

  constructor(age: number) {
    this.age = age;
  }
}
```

------

## Methods

- Methods have typed parameters and return types:

```ts
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

------

## Interview Tips

- Know how to declare classes with typed properties and methods.
- Understand the role of the constructor.
- Be able to instantiate and use class instances.

