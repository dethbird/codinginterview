# Types vs Interfaces

## Overview

Both **types** and **interfaces** in TypeScript define the shape of data structures but have different capabilities and use cases.

## What is a Type?

- `type` creates an alias for any valid TypeScript type (primitives, unions, tuples, objects, intersections).
- Very flexible and powerful for complex type compositions.

### Example

```ts
type ID = string | number;

type Status = "success" | "error" | "loading";

type User = {
  id: ID;
  name: string;
  active: boolean;
};

type Point = [number, number];
```

## What is an Interface?

- Primarily defines the shape of **objects**.
- Supports declaration merging (multiple declarations with the same name merge).
- Can be implemented by classes, supporting OOP patterns.

### Example

```ts
interface User {
  id: string | number;
  name: string;
  active: boolean;
}

interface Admin extends User {
  role: string;
}
```

## Key Differences

| Feature                           | Type Alias           | Interface                  |
| --------------------------------- | -------------------- | -------------------------- |
| Supports primitives/unions/tuples | ✔️                    | ❌                          |
| Declaration merging               | ❌                    | ✔️                          |
| Can be implemented by classes     | ❌                    | ✔️                          |
| Extending others                  | Intersection (`&`)   | Extend multiple interfaces |
| Better for object readability     | Sometimes less clear | Generally clearer          |

## Example: Interface Merging

```ts
interface Car {
  make: string;
}
interface Car {
  model: string;
}
const car: Car = { make: "Toyota", model: "Camry" };
```

Type aliases cannot merge like this.

