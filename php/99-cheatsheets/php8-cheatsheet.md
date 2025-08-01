# PHP 8 Cheatsheet

## New Features Overview

- **Union Types:** Accept multiple types in parameters and returns

  ```php
  function foo(int|string $value): int|string { }
  ```

- **Match Expression:** Cleaner alternative to `switch` with strict comparison

  ```php
  $result = match($value) {
      1 => 'One',
      2, 3 => 'Two or Three',
      default => 'Other',
  };
  ```

- **Named Arguments:** Pass arguments by name, skipping optional params

  ```php
  foo(name: "Alice", age: 30);
  ```

- **Constructor Property Promotion:** Define and initialize properties in constructor signature

  ```php
  class User {
      public function __construct(public string $name, public int $age) {}
  }
  ```

- **Attributes:** Native metadata using `#[Attribute]` syntax

  ```php
  #[Route('/api')]
  class ApiController { }
  ```

- **Nullsafe Operator:** Avoid null checks with `?->`

  ```php
  $country = $user?->address?->country;
  ```

- **Static Return Type:** Return type can be `static` for late static binding

- **JIT Compiler:** Improves performance for CPU-intensive tasks

------

## Syntax Highlights

| Feature               | Example                          |
| --------------------- | -------------------------------- |
| Union Types           | `function test(int               |
| Match Expression      | See above                        |
| Nullsafe Operator     | `$obj?->method()`                |
| Named Arguments       | `func(param1: 'a', param3: 'c')` |
| Attributes            | `#[MyAttribute]`                 |
| Constructor Promotion | See above                        |

------

## Other Improvements

- **Throw expressions:** `throw` can be used as an expression.

  ```php
  $value = $input ?: throw new Exception("Invalid");
  ```

- **Saner string to number comparisons:** Comparisons are more consistent.

- **Type system improvements:** Mixed type, static return type.

- **New string functions:** `str_contains()`, `str_starts_with()`, `str_ends_with()`

------

## Common Built-in Functions Added

- `str_contains(string $haystack, string $needle): bool`
- `str_starts_with(string $haystack, string $needle): bool`
- `str_ends_with(string $haystack, string $needle): bool`

------

## Best Practices for PHP 8

- Use strict typing with union types to improve code safety.
- Prefer `match` over `switch` when returning values.
- Utilize constructor property promotion to reduce boilerplate.
- Use nullsafe operator to avoid verbose null checks.
- Add attributes to improve metadata and tooling integration.

