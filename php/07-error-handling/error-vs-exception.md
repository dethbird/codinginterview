# PHP Error Handling: Error vs Exception

## What is an Error?

Errors represent serious problems that the script cannot recover from, such as syntax errors or memory exhaustion. Historically, errors were not catchable, but PHP 7 introduced throwable `Error` objects.

------

## What is an Exception?

Exceptions represent conditions that can be caught and handled gracefully during runtime, usually recoverable errors or special situations.

------

## Differences

| Feature     | Error                                    | Exception                        |
| ----------- | ---------------------------------------- | -------------------------------- |
| Origin      | Fatal or parse issues, runtime errors    | Application-level error handling |
| Catchable?  | PHP 7+: Yes (`Error` class is throwable) | Yes (extends `Exception`)        |
| Recoverable | Usually no                               | Yes                              |
| Usage       | Engine or fatal errors                   | User-defined or library errors   |

------

## Examples of Errors

- `ParseError` (syntax errors)
- `TypeError` (type mismatch)
- `ArithmeticError` (e.g., division by zero)

------

## Handling Errors and Exceptions Together

Since PHP 7, both `Error` and `Exception` implement `Throwable` interface, so you can catch them in one block:

```php
try {
    // code that might throw Exception or Error
} catch (Throwable $t) {
    echo "Caught: " . $t->getMessage();
}
```

------

## When to Use Which?

- Use **Exceptions** for recoverable errors and business logic.
- Let **Errors** indicate fatal or unrecoverable problems.

------

## Practical Example

```php
try {
    $result = 10 / 0; // Division by zero triggers ArithmeticError
} catch (Error $e) {
    echo "Error caught: " . $e->getMessage();
} catch (Exception $e) {
    echo "Exception caught: " . $e->getMessage();
}
```

------

## Best Practices

- Prefer exceptions for error handling in your application code.
- Use try-catch blocks to handle exceptions and prevent crashes.
- Log errors for debugging and monitoring.
- Avoid suppressing errors with `@` operator.

