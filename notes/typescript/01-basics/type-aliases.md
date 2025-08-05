# Type Aliases

## Overview

Type aliases create a new name for any type, including primitives, unions, intersections, tuples, and complex object types. They improve code readability and reuse.

------

## Basic Type Alias

```ts
type ID = number | string;

let userId: ID = 123;
userId = "abc123";
```

------

## Object Type Alias

```ts
type User = {
  id: ID;
  name: string;
  active: boolean;
};

const user: User = {
  id: 1,
  name: "Alice",
  active: true,
};
```

------

## Union Types

Allows a variable to be one of several types:

```ts
type Status = "success" | "error" | "loading";

function printStatus(status: Status) {
  console.log(status);
}

printStatus("success");  // ✅ valid
// printStatus("fail");  // ❌ error
```

------

## Intersection Types

Combine multiple types into one:

```ts
type HasId = { id: number };
type HasName = { name: string };

type Entity = HasId & HasName;

const entity: Entity = {
  id: 5,
  name: "Sample",
};
```

------

## Tuple Alias

```ts
type Point = [number, number];

const origin: Point = [0, 0];
```

------

## Differences from Interfaces

- Type aliases can represent any type, not just object shapes.
- Cannot be reopened or merged like interfaces.
- Interfaces are preferred for OOP-style patterns and extendability.

------

## Interview Tips

- Use type aliases for unions, intersections, and tuples.
- Understand when to use type aliases versus interfaces.
- Be able to show practical examples.

