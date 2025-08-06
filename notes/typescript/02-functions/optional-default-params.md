# Optional and Default Parameters

## Overview

TypeScript allows you to define optional and default parameters in functions to make parameters flexible.

------

## Optional Parameters

- Mark parameters as optional using `?`.
- Optional parameters must come **after** all required parameters.

```ts
function greet(name: string, greeting?: string) {
  console.log(`${greeting ?? "Hello"}, ${name}!`);
}

greet("Alice");           // "Hello, Alice!"
greet("Bob", "Hi");       // "Hi, Bob!"
```

------

## Default Parameters

- Provide default values to parameters.
- If the argument is omitted or `undefined`, the default is used.

```ts
function greet(name: string, greeting: string = "Hello") {
  console.log(`${greeting}, ${name}!`);
}

greet("Alice");           // "Hello, Alice!"
greet("Bob", "Hi");       // "Hi, Bob!"
```

------

## Difference Between Optional and Default Parameters

| Feature                              | Optional Parameter | Default Parameter         |
| ------------------------------------ | ------------------ | ------------------------- |
| Can be omitted                       | Yes                | Yes                       |
| Default value assigned               | No                 | Yes                       |
| If omitted, parameter is `undefined` | Yes                | No, default value is used |

------

## Example with Both

```ts
function buildName(firstName: string, lastName?: string) {
  if (lastName) {
    return `${firstName} ${lastName}`;
  }
  return firstName;
}

function buildNameWithDefault(firstName: string, lastName = "Smith") {
  return `${firstName} ${lastName}`;
}
```

------

## Interview Tips

- Know syntax for optional (`?`) and default parameters.
- Remember optional must come last in parameter list.
- Understand how default parameters work with omitted or undefined arguments.

------

Shall we proceed to **rest-params**?