# PHP Error Handling: try-catch

## What is try-catch?

The `try-catch` block handles exceptions, allowing graceful recovery from errors without stopping the script.

------

## Basic Syntax

```php
try {
    // Code that may throw exception
    $result = riskyOperation();
} catch (Exception $e) {
    // Handle exception
    echo "Error: " . $e->getMessage();
}
```

------

## Multiple catch Blocks

Catch different exception types separately:

```php
try {
    // code
} catch (InvalidArgumentException $e) {
    echo "Invalid argument: " . $e->getMessage();
} catch (Exception $e) {
    echo "General error: " . $e->getMessage();
}
```

------

## Finally Block

Code in `finally` runs regardless of exceptions.

```php
try {
    // code
} catch (Exception $e) {
    // handle
} finally {
    // cleanup code
}
```

------

## Throwing Exceptions

Use `throw` keyword to raise an exception.

```php
function divide($a, $b) {
    if ($b == 0) {
        throw new Exception("Division by zero");
    }
    return $a / $b;
}
```

------

## Custom Exceptions

Extend the base `Exception` class:

```php
class MyException extends Exception {}

throw new MyException("Custom error");
```

------

## Practical Example

```php
try {
    echo divide(10, 0);
} catch (Exception $e) {
    echo "Caught error: " . $e->getMessage();
}
```

------

## Best Practices

- Use exceptions for unexpected or fatal errors.
- Catch specific exceptions to handle known error types.
- Avoid using exceptions for control flow.
- Clean up resources in `finally` block if needed.

