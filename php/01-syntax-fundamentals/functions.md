Here’s your `functions.md` notes — with clear explanations and practical examples to prep for interviews:

------

# PHP Functions

## What is a Function?

A function is a reusable block of code designed to perform a specific task. Functions help organize code, avoid repetition, and improve readability.

------

## Declaring a Function

```php
function greet($name) {
    return "Hello, $name!";
}
```

- `function` keyword starts the declaration.
- `$name` is a parameter.
- `return` sends a value back to the caller.

------

## Calling a Function

```php
echo greet("Alice");  // outputs: Hello, Alice!
```

------

## Function Parameters

- Parameters are variables passed to functions.
- PHP supports default parameter values.

```php
function greet($name = "Guest") {
    return "Hello, $name!";
}

echo greet();        // Hello, Guest!
echo greet("Bob");   // Hello, Bob!
```

- Parameters are passed by value by default (copies).
- Use `&` to pass by reference (changes affect the caller).

```php
function addExclamation(&$str) {
    $str .= "!";
}

$message = "Hi";
addExclamation($message);
echo $message;  // outputs: Hi!
```

------

## Variable-Length Argument Lists

PHP supports variadic functions to accept any number of arguments.

```php
function sum(...$numbers) {
    return array_sum($numbers);
}

echo sum(1, 2, 3, 4);  // 10
```

------

## Return Types (PHP 7+)

You can declare the return type after the parameter list.

```php
function getAge(): int {
    return 30;
}
```

If the return value does not match the declared type, a TypeError is thrown.

------

## Anonymous Functions (Closures)

Functions without a name, often used as callbacks.

```php
$greet = function($name) {
    return "Hi, $name!";
};

echo $greet("Alice");  // Hi, Alice!
```

You can also pass anonymous functions as arguments:

```php
$numbers = [1, 2, 3, 4];

$squared = array_map(function($n) {
    return $n * $n;
}, $numbers);

print_r($squared);  // [1, 4, 9, 16]
```

------

## Arrow Functions (PHP 7.4+)

Shorter syntax for simple one-expression functions.

```php
$squared = array_map(fn($n) => $n * $n, $numbers);
```

------

## Recursion

Functions can call themselves.

```php
function factorial($n): int {
    if ($n <= 1) return 1;
    return $n * factorial($n - 1);
}

echo factorial(5);  // 120
```

------

## Practical Example: Greeting Function with Validation

```php
function greet($name) {
    if (!is_string($name) || empty($name)) {
        return "Invalid name";
    }
    return "Hello, " . ucfirst($name);
}

echo greet("alice");  // Hello, Alice
echo greet("");       // Invalid name
```

------

## Best Practices

- Always name functions clearly to reflect their purpose.
- Use type declarations for parameters and return types where possible.
- Keep functions small and focused.
- Use default parameters and variadic functions for flexibility.
- Prefer anonymous functions for short callback code.

