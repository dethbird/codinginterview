# Access Modifiers

## Overview

TypeScript adds access modifiers to control visibility of class members.

------

## Modifiers

| Modifier    | Description                                 |
| ----------- | ------------------------------------------- |
| `public`    | Default. Accessible everywhere.             |
| `private`   | Accessible only within the class itself.    |
| `protected` | Accessible within the class and subclasses. |

------

## Examples

```ts
class Person {
  public name: string;
  private ssn: string;
  protected age: number;

  constructor(name: string, ssn: string, age: number) {
    this.name = name;
    this.ssn = ssn;
    this.age = age;
  }

  public greet() {
    console.log(`Hi, I'm ${this.name}`);
  }

  private getSSN() {
    return this.ssn;
  }

  protected getAge() {
    return this.age;
  }
}

const person = new Person("Alice", "123-45-6789", 30);
console.log(person.name);    // OK
// console.log(person.ssn);  // Error: private property
// console.log(person.age);  // Error: protected property
person.greet();              // OK
```

------

## Subclass Access

```ts
class Employee extends Person {
  public showAge() {
    console.log(this.age); // OK: protected accessible in subclass
  }
}
```

------

## Interview Tips

- Know the differences between `public`, `private`, and `protected`.
- Understand default visibility (`public`).
- Be ready to explain accessibility in subclasses and outside the class.

