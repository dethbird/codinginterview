# PHP 8 Features: Named Arguments

## What Are Named Arguments?

Named arguments allow you to pass arguments to a function based on parameter names rather than position, improving readability and flexibility.

------

## Syntax

You specify the parameter name followed by a colon and the value.

```php
function greet(string $name, string $greeting = "Hello") {
    echo "$greeting, $name!";
}

greet(name: "Alice", greeting: "Hi");   // Hi, Alice!
greet(greeting: "Hey", name: "Bob");    // Hey, Bob!
greet(name: "Charlie");                  // Hello, Charlie!
```

------

## Benefits

- You can skip optional parameters and specify only those you want.
- Improves clarity when functions have many parameters.
- Allows changing argument order without affecting the call.

------

## Mixing Positional and Named Arguments

Positional arguments must come first, then named arguments:

```php
greet("Alice", greeting: "Hi");  // Valid
greet(name: "Alice", "Hi");      // Syntax Error
```

------

## Use Cases

- Functions with many optional parameters.
- Functions where arguments benefit from being explicitly named.
- Reducing bugs caused by incorrect argument ordering.

------

## Limitations

- Works only with PHP 8.0+.
- Named arguments cannot be used with variadic parameters.
- Cannot repeat the same parameter both positionally and by name.

------

## Practical Example: Array Fill Function

```php
array_fill(start_index: 0, count: 5, value: 'apple');
// same as array_fill(0, 5, 'apple')
```

------

## Best Practices

- Use named arguments for clarity in function calls with many parameters.
- Avoid mixing named and positional arguments in confusing ways.
- Review function signatures carefully to use named arguments correctly.

