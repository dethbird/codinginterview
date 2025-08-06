Here’s your `loops-conditionals.md` notes, clear and example-rich for interview reference:

------

# PHP Loops and Conditionals

## Conditionals

### `if`, `else if`, `else`

Use conditionals to execute code based on boolean expressions.

```php
$age = 18;

if ($age >= 18) {
    echo "Adult";
} elseif ($age >= 13) {
    echo "Teenager";
} else {
    echo "Child";
}
```

------

### `switch`

Useful for comparing one value against many options.

```php
$day = "Monday";

switch ($day) {
    case "Monday":
        echo "Start of the week";
        break;
    case "Friday":
        echo "Almost weekend";
        break;
    default:
        echo "Another day";
}
```

------

## Loops

### `for` loop

Runs a block of code a specified number of times.

```php
for ($i = 0; $i < 5; $i++) {
    echo $i . "\n";  // outputs 0 1 2 3 4
}
```

------

### `while` loop

Repeats while a condition is true.

```php
$count = 0;
while ($count < 5) {
    echo $count . "\n";
    $count++;
}
```

------

### `do-while` loop

Executes at least once, then repeats while condition true.

```php
$count = 0;
do {
    echo $count . "\n";
    $count++;
} while ($count < 5);
```

------

### `foreach` loop

Best for iterating arrays.

```php
$colors = ["red", "green", "blue"];

foreach ($colors as $color) {
    echo $color . "\n";
}
```

With keys:

```php
$user = ["name" => "Alice", "age" => 30];

foreach ($user as $key => $value) {
    echo "$key: $value\n";
}
```

------

## Break and Continue

- `break`: exit loop early.

```php
for ($i = 0; $i < 10; $i++) {
    if ($i == 3) break;
    echo $i;  // outputs 0 1 2
}
```

- `continue`: skip current iteration.

```php
for ($i = 0; $i < 5; $i++) {
    if ($i == 2) continue;
    echo $i;  // outputs 0 1 3 4
}
```

------

## Ternary Operator

Shorthand for simple `if-else`:

```php
$status = ($age >= 18) ? "Adult" : "Minor";
echo $status;
```

From PHP 7.4+, you can use the null coalescing assignment:

```php
$username = $_GET['user'] ?? 'guest';
```

------

## Practical Example: Find Even Numbers

```php
$numbers = [1, 2, 3, 4, 5, 6];

foreach ($numbers as $num) {
    if ($num % 2 !== 0) {
        continue;
    }
    echo $num . " is even\n";
}
```

------

## Best Practices

- Use `foreach` for arrays — clearer and safer.
- Use `switch` when checking one variable against many values.
- Use ternary for simple conditional assignments.
- Avoid deeply nested conditionals to keep code readable.

