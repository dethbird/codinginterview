# Interview Patterns: String Reversal in PHP

## What is String Reversal?

Reversing a string means producing a new string with characters in the opposite order.

------

## Simple Implementation Using Built-in Function

```php
function reverseString(string $str): string {
    return strrev($str);
}
```

------

## Manual Implementation

```php
function reverseString(string $str): string {
    $reversed = '';
    $length = strlen($str);
    for ($i = $length - 1; $i >= 0; $i--) {
        $reversed .= $str[$i];
    }
    return $reversed;
}
```

------

## Using `mb_*` for Multibyte Strings

For UTF-8 or multibyte strings:

```php
function reverseUtf8String(string $str): string {
    $reversed = '';
    for ($i = mb_strlen($str) - 1; $i >= 0; $i--) {
        $reversed .= mb_substr($str, $i, 1);
    }
    return $reversed;
}
```

------

## Usage Example

```php
echo reverseString("hello"); // olleh
```

------

## Best Practices

- Use `strrev()` for ASCII strings.
- Use `mb_*` functions for multibyte character support.
- Avoid string concatenation in loops for very large strings (consider other methods if performance critical).

