# Never Type

## Overview

The `never` type represents values that never occur. It’s used to indicate unreachable code, infinite loops, or functions that throw exceptions and don’t return.

------

## Common Uses

### 1. Functions that never return

```ts
function throwError(message: string): never {
  throw new Error(message);
}
```

### 2. Exhaustiveness checks in discriminated unions

Used to ensure all cases are handled:

```ts
type Shape = { kind: "circle"; radius: number } | { kind: "square"; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

If a new case is added to `Shape` but not handled, TypeScript will error here.

------

## Interview Tips

- Know `never` signals unreachable code or non-returning functions.
- Use it for exhaustive checks in unions.
- Understand it’s a subtype of every type but no type is assignable to `never` (except `never` itself).

