# Try-Catch Typing

## Overview

TypeScript types the `try-catch` block, but the `catch` clause variable defaults to `unknown` (from TS 4.4+), requiring proper narrowing before use.

------

## Basic Try-Catch

```ts
try {
  // risky code
} catch (error) {
  console.error(error);
}
```

- `error` is typed as `unknown` by default, safer than `any`.

------

## Narrowing the Catch Variable

Use type guards to safely access properties:

```ts
try {
  throw new Error("Oops");
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message); // Safe access
  } else {
    console.log("Unknown error", error);
  }
}
```

------

## Custom Error Types

Define custom error classes to differentiate errors:

```ts
class CustomError extends Error {
  constructor(message: string) {
    super(message);
  }
}

try {
  throw new CustomError("Custom failure");
} catch (error: unknown) {
  if (error instanceof CustomError) {
    console.log("Custom error:", error.message);
  }
}
```

------

## Interview Tips

- Know that catch clause error is `unknown` by default.
- Demonstrate safe narrowing using `instanceof` or other guards.
- Avoid assuming `error` is always an `Error` object.

