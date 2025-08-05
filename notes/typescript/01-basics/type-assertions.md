# Type Assertions in TypeScript

Type assertions tell the TypeScript compiler to treat a value as a specific type, overriding its inferred type without performing any runtime checks.

------

### Syntax

There are two ways to assert types:

```ts
// Angle bracket syntax (not recommended in TSX/React)
let someValue: any = "hello";
let strLength: number = (<string>someValue).length;

// As syntax (recommended)
let someValue2: any = "world";
let strLength2: number = (someValue2 as string).length;
```

------

### When to Use Type Assertions

- When you know more about a value's type than TypeScript can infer.
- When working with DOM APIs that return `HTMLElement | null`, but you know the element exists.
- To convert between compatible types.

------

### Example: DOM element

```ts
const input = document.getElementById("username") as HTMLInputElement;
console.log(input.value);
```

Without assertion, TypeScript treats `input` as `HTMLElement | null`, which lacks a `value` property.

------

### Unsafe Assertions

- Be cautious: assertions don’t do any runtime checks.
- Incorrect assertions can cause runtime errors.

------

### Narrowing vs Assertions

- Narrowing uses checks like `typeof`, `instanceof`.
- Assertions just tell the compiler “trust me” and force a type.

------

### Example: Narrowing vs Assertion

```ts
function getLength(value: string | number) {
  if (typeof value === "string") {
    return value.length; // narrowed
  } else {
    // force assertion (unsafe if value is not a number)
    return (value as number).toString().length;
  }
}
```

------

### Tips for interviews:

- Explain difference between assertion and type casting.
- Show safe uses, e.g., DOM access or type narrowing.
- Warn about unsafe assertions that bypass type safety.

