# Implements vs Extends

## Overview

In TypeScript classes, **`extends`** is used for class inheritance, while **`implements`** is used to enforce that a class follows an interface or type.

------

## `extends` — Class Inheritance

- Allows a class to inherit properties and methods from a base class.
- Supports method overriding and reuse.

```ts
class Animal {
  move() {
    console.log("Moving along...");
  }
}

class Dog extends Animal {
  bark() {
    console.log("Woof!");
  }
}

const dog = new Dog();
dog.move();  // Output: Moving along...
dog.bark();  // Output: Woof!
```

------

## `implements` — Interface/Type Enforcement

- Enforces that a class conforms to a specific interface or type.
- The class must define all properties and methods declared by the interface.

```ts
interface Flyer {
  fly(): void;
}

class Bird implements Flyer {
  fly() {
    console.log("Flying!");
  }
}

// Error: Class must implement 'fly' method
// class Fish implements Flyer {}
```

------

## Differences Summary

| Feature           | `extends`                             | `implements`                         |
| ----------------- | ------------------------------------- | ------------------------------------ |
| Inherits behavior | Yes (inherits methods and properties) | No (only checks type conformity)     |
| Used for          | Class inheritance                     | Interface/type compliance            |
| Supports multiple | No (single inheritance only)          | Yes (implements multiple interfaces) |

------

## Example: Multiple Interfaces

```ts
interface Swimmer {
  swim(): void;
}

class Duck implements Flyer, Swimmer {
  fly() {
    console.log("Flying!");
  }
  swim() {
    console.log("Swimming!");
  }
}
```

------

## Interview Tips

- Know when to use `extends` vs `implements`.
- Understand that `extends` inherits actual code; `implements` enforces structure.
- Be ready to explain multiple interface implementation.

