# PHP 8 Features: Union Types

## What are Union Types?

Union types allow a parameter, property, or return type to accept multiple types, enhancing type flexibility and strictness.

------

## Syntax

Use the pipe `|` symbol to declare multiple acceptable types.

```php
function process(int|string $value): int|string {
    if (is_int($value)) {
        return $value * 2;
    }
    return strtoupper($value);
}
```

------

## Usage Examples

### Function Parameters

```php
function setId(int|string $id) {
    echo "ID is $id";
}

setId(10);
setId("abc123");
```

### Return Types

```php
function getValue(bool $flag): int|float|null {
    if ($flag) return 10;
    return null;
}
```

------

## Properties with Union Types

```php
class User {
    public int|string $id;

    public function __construct(int|string $id) {
        $this->id = $id;
    }
}
```

------

## Nullable Types Alternative

Union types can replace nullable syntax.

```php
// Before PHP 8
function foo(?int $x) {}

// PHP 8 with union
function foo(int|null $x) {}
```

------

## Benefits

- More precise type declarations.
- Reduces the need for PHPDoc comments for multiple types.
- Enables better static analysis and error detection.

------

## Limitations

- Union types cannot include `void` or `mixed`.
- `null` must be explicitly included if allowed.
- Intersection types (all types must be satisfied) were introduced in PHP 8.1 (different from union).

------

## Practical Example: Accepting Multiple Types

```php
function formatId(int|string $id): string {
    return (string)$id;
}

echo formatId(101);       // "101"
echo formatId("A-102");   // "A-102"
```

------

## Best Practices

- Use union types when your API expects or returns multiple types.
- Include `null` explicitly if nullability is required.
- Avoid overly complex union types to maintain readability.