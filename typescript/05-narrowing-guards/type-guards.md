# Type Guards

## Overview

Type guards are expressions or functions that perform runtime checks to **narrow** the type of a variable within a conditional block, enabling safer and more precise code.

------

## Built-in Type Guards

- Using `typeof`:

```ts
function printId(id: string | number) {
  if (typeof id === "string") {
    console.log(id.toUpperCase()); // string methods allowed here
  } else {
    console.log(id.toFixed(2));    // number methods allowed here
  }
}
```

- Using `instanceof`:

```ts
class Dog { bark() {} }
class Cat { meow() {} }

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}
```

------

## Custom Type Guards

You can write functions that return a **type predicate**:

```ts
interface Bird {
  fly(): void;
}
interface Fish {
  swim(): void;
}

function isFish(pet: Bird | Fish): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Bird | Fish) {
  if (isFish(pet)) {
    pet.swim();
  } else {
    pet.fly();
  }
}
```

------

## Using `in` Operator

Check for existence of a property:

```ts
function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}
```

------

## Interview Tips

- Know how to use `typeof`, `instanceof`, `in` for narrowing.
- Be able to write custom type guards with type predicates (`param is Type`).
- Explain why narrowing improves type safety and avoids errors.

