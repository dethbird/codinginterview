# Types vs Interfaces (Interview Patterns)

## Overview

This file revisits the core differences and best practices when using **types** vs **interfaces** in TypeScript, focusing on patterns useful in interviews.

------

## Recap: Types

- Used for unions, intersections, tuples, primitives, and object shapes.
- Cannot be reopened or merged.
- More flexible for complex types.

```ts
type User = { id: number; name: string } | null;
```

------

## Recap: Interfaces

- Best suited for describing object shapes.
- Supports declaration merging.
- Can be implemented by classes.
- Extensible via `extends`.

```ts
interface User {
  id: number;
  name: string;
}

interface User {
  age?: number; // Declaration merging adds age property
}
```

------

## When to Prefer Which?

| Scenario                     | Use Interface | Use Type Alias |
| ---------------------------- | ------------- | -------------- |
| Extensible object shapes     | ✔️             | ❌ (no merging) |
| Complex unions or primitives | ❌             | ✔️              |
| Implementing in classes      | ✔️             | ❌              |
| Simple object types          | Either        | Either         |

------

## Common Gotchas

- Using `type` for objects disallows declaration merging.
- Interfaces can’t describe union types directly.
- Types can represent tuples and mapped types; interfaces cannot.
- Mixing use can cause confusion — pick one style consistently.

------

## Interview Tips

- Show understanding of differences and trade-offs.
- Demonstrate usage with realistic examples.
- Explain scenarios where one is preferred over the other.

