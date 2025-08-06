# PHP Cheatsheet: Error Types

## Overview

PHP has several error types to indicate issues during code execution. Since PHP 7, many errors are throwable objects.

------

## Major Error Types

| Error Type        | Description                                  | Catchable? | Example                                          |
| ----------------- | -------------------------------------------- | ---------- | ------------------------------------------------ |
| `Error`           | Base class for fatal errors                  | Yes        | Base for engine errors                           |
| `Exception`       | Base class for exceptions                    | Yes        | User-defined and built-in exceptions             |
| `ParseError`      | Syntax error detected at compile time        | Yes        | Missing semicolon                                |
| `TypeError`       | Type hint violations                         | Yes        | Passing string to int param                      |
| `ArithmeticError` | Arithmetic failures (e.g., division by zero) | Yes        | Division by zero                                 |
| `ErrorException`  | Traditional PHP error converted to exception | Yes        | Used for error handling with `set_error_handler` |

------

## Handling Errors and Exceptions

Catch all throwables:

```php
try {
    // Code that may throw Exception or Error
} catch (Throwable $t) {
    echo "Error caught: " . $t->getMessage();
}
```

------

## Common PHP Errors (Warnings, Notices)

- **Warning:** Non-fatal runtime issues (e.g., include file not found).
- **Notice:** Informational messages (e.g., undefined variable).

These are not exceptions but can be converted to exceptions.

------

## Using `set_error_handler` to Convert Errors

```php
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
```

------

## Best Practices

- Use exceptions for handling recoverable errors.
- Handle errors and exceptions consistently.
- Log errors and exceptions for debugging.
- Use strict typing to catch type errors early.

