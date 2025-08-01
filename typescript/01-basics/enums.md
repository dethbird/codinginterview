# Enums

## Overview

Enums in TypeScript define a set of named constants, improving code readability and maintainability compared to magic numbers or strings.

------

## Basic Numeric Enum

```ts
enum Direction {
  Up,
  Down,
  Left,
  Right
}

let move: Direction = Direction.Up;
```

- Members auto-assign numeric values starting at 0.
- Reverse mapping is supported:

```ts
console.log(Direction.Up);   // 0
console.log(Direction[0]);   // "Up"
```

------

## Custom Numeric Values

You can assign explicit values, and following members auto-increment:

```ts
enum Status {
  Pending = 1,
  InProgress,
  Done = 10
}

console.log(Status.InProgress); // 2
```

------

## String Enums

Enums with string values improve clarity, but no reverse mapping:

```ts
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

let c: Color = Color.Green;
```

------

## Heterogeneous Enums

Mixing strings and numbers is possible but generally discouraged:

```ts
enum Mixed {
  No = 0,
  Yes = "YES"
}
```

------

## Const Enums

`const enum` inlines enum values during compilation, improving performance:

```ts
const enum Direction {
  Up,
  Down,
  Left,
  Right
}

let move = Direction.Left; // Compiled as let move = 2;
```

Note: Cannot use computed members with `const enum`.

------

## Use Cases

- Representing a fixed set of options or states.
- Avoid magic numbers/strings for clarity.
- Strong typing and autocomplete support.

------

## Example Usage

```ts
enum LogLevel {
  Error,
  Warn,
  Info,
  Debug
}

function log(level: LogLevel, message: string) {
  if (level <= LogLevel.Warn) {
    console.error(message);
  } else {
    console.log(message);
  }
}

log(LogLevel.Error, "Critical error!");
```

------

## Interview Tips

- Know numeric vs string enums.
- Understand auto-increment behavior.
- Explain `const enum` benefits and limitations.

