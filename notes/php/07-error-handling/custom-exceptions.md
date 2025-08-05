# PHP Error Handling: Custom Exceptions

## What are Custom Exceptions?

Custom exceptions extend PHP’s base `Exception` class to represent specific error types in your application for better error handling.

------

## Defining a Custom Exception

```php
class ValidationException extends Exception {
    // You can add custom properties or methods if needed
}
```

------

## Throwing Custom Exceptions

```php
function validateAge($age) {
    if ($age < 0) {
        throw new ValidationException("Age cannot be negative");
    }
}
```

------

## Catching Custom Exceptions

```php
try {
    validateAge(-5);
} catch (ValidationException $e) {
    echo "Validation error: " . $e->getMessage();
} catch (Exception $e) {
    echo "General error: " . $e->getMessage();
}
```

------

## Adding Custom Properties or Methods

```php
class DatabaseException extends Exception {
    private $query;

    public function __construct($message, $query) {
        parent::__construct($message);
        $this->query = $query;
    }

    public function getQuery() {
        return $this->query;
    }
}
```

------

## Practical Example

```php
try {
    throw new DatabaseException("Query failed", "SELECT * FROM users");
} catch (DatabaseException $e) {
    echo "Error: " . $e->getMessage();
    echo "Query: " . $e->getQuery();
}
```

------

## Best Practices

- Use custom exceptions to categorize errors logically.
- Provide additional context via custom properties/methods.
- Catch specific exceptions for precise error handling.
- Avoid creating too many custom exceptions; keep it manageable.

