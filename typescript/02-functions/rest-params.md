# Rest Parameters

## Overview

Rest parameters allow a function to accept an indefinite number of arguments as an array.

------

## Syntax

```ts
function sum(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3)); // 6
console.log(sum(4, 5));    // 9
```

- The `...numbers` collects all remaining arguments into an array.
- Only one rest parameter is allowed, and it must be last.

------

## Use Cases

- Functions accepting variable numbers of arguments.
- Wrapping or forwarding arguments.

------

## Example: Logging

```ts
function logMessages(level: string, ...messages: string[]) {
  messages.forEach(msg => console.log(`[${level}] ${msg}`));
}

logMessages("INFO", "Starting process", "Process running", "Process complete");
```

------

## Interview Tips

- Understand the `...` syntax and that the rest parameter is an array.
- Only one rest parameter allowed per function.
- Rest parameter must be the last parameter.

