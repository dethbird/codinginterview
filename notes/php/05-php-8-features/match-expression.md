# PHP 8 Features: Match Expression

## What is a Match Expression?

The `match` expression is a new control structure similar to `switch` but with safer semantics, returning values, strict type checks, and no fall-through.

------

## Basic Syntax

```php
$result = match($value) {
    1 => 'One',
    2, 3 => 'Two or Three',
    default => 'Other',
};
```

------

## Key Differences from `switch`

- `match` returns a value.
- No implicit fall-through between cases.
- Uses strict comparison (`===`).
- Cases must be unique.
- Supports multiple conditions per case separated by commas.
- Requires a `default` case or all possible values covered.

------

## Example Usage

```php
$status = 2;

$message = match($status) {
    1 => 'Pending',
    2, 3 => 'Processing',
    4 => 'Completed',
    default => 'Unknown',
};

echo $message;  // Processing
```

------

## Using Expressions in Cases

```php
$score = 85;

$grade = match(true) {
    $score >= 90 => 'A',
    $score >= 80 => 'B',
    $score >= 70 => 'C',
    default => 'F',
};

echo $grade; // B
```

------

## Benefits

- Cleaner and less error-prone than `switch`.
- Returns a value directly.
- Avoids accidental fall-through bugs.
- Strict comparison improves safety.

------

## Practical Example: HTTP Status Messages

```php
function getStatusMessage(int $code): string {
    return match($code) {
        200 => 'OK',
        404 => 'Not Found',
        500 => 'Internal Server Error',
        default => 'Unknown Status',
    };
}

echo getStatusMessage(404); // Not Found
```

------

## Best Practices

- Use `match` when you need to return a value based on a condition.
- Use `switch` if you need complex statement blocks or fall-through behavior.
- Always provide a `default` case to handle unexpected values.