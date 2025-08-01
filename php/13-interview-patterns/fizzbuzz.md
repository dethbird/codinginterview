# Interview Patterns: FizzBuzz in PHP

## What is FizzBuzz?

FizzBuzz is a classic programming challenge:

- Print numbers from 1 to N.
- For multiples of 3, print `"Fizz"`.
- For multiples of 5, print `"Buzz"`.
- For multiples of both 3 and 5, print `"FizzBuzz"`.

------

## PHP Implementation

```php
function fizzBuzz(int $n): void {
    for ($i = 1; $i <= $n; $i++) {
        if ($i % 15 === 0) {
            echo "FizzBuzz\n";
        } elseif ($i % 3 === 0) {
            echo "Fizz\n";
        } elseif ($i % 5 === 0) {
            echo "Buzz\n";
        } else {
            echo $i . "\n";
        }
    }
}
```

------

## Usage Example

```php
fizzBuzz(20);
```

Outputs:

```
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
16
17
Fizz
19
Buzz
```

------

## Variations and Tips

- Use concatenation to reduce conditionals:

```php
function fizzBuzz(int $n): void {
    for ($i = 1; $i <= $n; $i++) {
        $output = '';
        if ($i % 3 === 0) $output .= 'Fizz';
        if ($i % 5 === 0) $output .= 'Buzz';
        echo $output ?: $i;
        echo "\n";
    }
}
```

- Remember to use strict comparison (`===`).

------

## Best Practices

- Use `%` modulus operator for divisibility checks.
- Prioritize combined condition to avoid missing `"FizzBuzz"`.
- Keep code clean and readable.

