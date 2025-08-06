# PHP Arrays

## What is an Array in PHP?

An array in PHP is a data structure that stores multiple values in one variable. Arrays can hold values of any type and can be indexed by numbers or strings (associative arrays).

------

## Types of Arrays

### 1. Indexed Arrays

Arrays with numeric keys starting at 0 by default.

**Example:**

```php
$fruits = ["apple", "banana", "cherry"];
echo $fruits[1];  // outputs: banana
```

You can also create them like this:

```php
$fruits = array("apple", "banana", "cherry");
```

------

### 2. Associative Arrays

Arrays with string keys.

**Example:**

```php
$user = [
    "name" => "Alice",
    "age" => 30,
    "email" => "alice@example.com"
];

echo $user["email"]; // outputs: alice@example.com
```

------

### 3. Multidimensional Arrays

Arrays containing one or more arrays.

**Example:**

```php
$contacts = [
    "John" => ["phone" => "123-456", "email" => "john@example.com"],
    "Jane" => ["phone" => "789-012", "email" => "jane@example.com"]
];

echo $contacts["John"]["email"]; // outputs: john@example.com
```

------

## Adding and Modifying Elements

- Add element to the end:

```php
$fruits[] = "orange"; // adds "orange" at the end
```

- Add element with specific key:

```php
$user["city"] = "New York";
```

- Modify element by key:

```php
$fruits[0] = "grape"; // replaces "apple" with "grape"
```

------

## Common Array Functions

- `count($array)`: number of elements
- `array_push($array, $value)`: add value to end
- `array_pop($array)`: remove and return last element
- `array_shift($array)`: remove and return first element
- `array_unshift($array, $value)`: add value to start
- `in_array($value, $array)`: check if value exists
- `array_keys($array)`: get all keys
- `array_values($array)`: get all values
- `array_merge($array1, $array2)`: merge arrays
- `array_slice($array, $offset, $length)`: get part of array

**Examples:**

```php
$numbers = [1, 2, 3];
array_push($numbers, 4);       // [1, 2, 3, 4]
$last = array_pop($numbers);   // removes 4, $last = 4
$first = array_shift($numbers); // removes 1, $first = 1
array_unshift($numbers, 0);    // [0, 2, 3]
```

------

## Looping Through Arrays

### Using `foreach`

```php
foreach ($fruits as $fruit) {
    echo $fruit . "\n";
}
```

### Using key and value

```php
foreach ($user as $key => $value) {
    echo "$key: $value\n";
}
```

------

## Checking for Keys or Values

- Check if key exists: `array_key_exists($key, $array)`
- Check if value exists: `in_array($value, $array)`

**Example:**

```php
if (array_key_exists("email", $user)) {
    echo "Email is set.";
}

if (in_array("banana", $fruits)) {
    echo "Banana is in the list.";
}
```

------

## Array Destructuring (PHP 7.1+)

You can extract variables from arrays using `list()` or short syntax.

```php
$person = ["Alice", 30];

list($name, $age) = $person;
// or
[$name, $age] = $person;

echo $name; // Alice
echo $age;  // 30
```

------

## Practical Example: Counting Frequency of Items

```php
$colors = ["red", "blue", "red", "green", "blue", "blue"];
$counts = array_count_values($colors);

print_r($counts);
// Output:
// Array ( [red] => 2 [blue] => 3 [green] => 1 )
```

------

## Best Practices

- Use associative arrays for structured data.
- Prefer `foreach` for iteration — cleaner and less error-prone.
- Be mindful of keys — mixing numeric and string keys can lead to unexpected behavior.
- Avoid large multidimensional arrays if data can be modeled with objects.

