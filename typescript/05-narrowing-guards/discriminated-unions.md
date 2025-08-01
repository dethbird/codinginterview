# Discriminated Unions

## Overview

Discriminated unions (also called tagged unions or algebraic data types) combine union types with a **common literal property** to enable type-safe narrowing.

------

## Structure

- Each type in the union has a **literal discriminant** property with a unique value.
- TypeScript uses this property to narrow the type.

------

## Example

```ts
interface Square {
  kind: "square";
  size: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Circle {
  kind: "circle";
  radius: number;
}

type Shape = Square | Rectangle | Circle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size * shape.size;
    case "rectangle":
      return shape.width * shape.height;
    case "circle":
      return Math.PI * shape.radius ** 2;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

------

## Benefits

- Provides **exhaustive type checking** in switch or if-else.
- Clear and maintainable code for complex unions.

------

## Interview Tips

- Understand the role of the discriminant property (usually `kind` or `type`).
- Use `switch` with exhaustive checks to handle all cases.
- Know how this pattern helps avoid runtime errors by catching unhandled cases.

