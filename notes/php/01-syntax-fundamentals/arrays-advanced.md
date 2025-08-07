# PHP Arrays: Advanced Functions with Detailed Docblocks

---

## `array_filter()`

```php
/**
 * Filters elements of an array using a callback function.
 *
 * @param array $array The input array.
 * @param callable|null $callback Optional. Callback function to use.
 *        If null, removes falsy values.
 *        The callback receives the value by default.
 * @param int $flag Optional. What to pass to callback:
 *        - ARRAY_FILTER_USE_KEY to pass key only,
 *        - ARRAY_FILTER_USE_BOTH to pass both value and key.
 * @return array Filtered array, preserving keys.
 */
function exampleArrayFilter(): void {
    $numbers = [1, 2, 3, 4, 5, 6];

    // Keep only even numbers
    $evens = array_filter($numbers, fn($n) => $n % 2 === 0);
    print_r($evens);
    // Output: [1 => 2, 3 => 4, 5 => 6]

    // Filter by key: keep even keys
    $filteredByKey = array_filter($numbers, fn($key) => $key % 2 === 0, ARRAY_FILTER_USE_KEY);
    print_r($filteredByKey);
    // Output: [0 => 1, 2 => 3, 4 => 5]
}
```

---

## `array_map()`

```php
/**
 * Applies a callback to the elements of given arrays.
 *
 * @param callable $callback Callback to run on each element.
 *        It receives as many parameters as there are arrays.
 * @param array ...$arrays One or more arrays to map over.
 * @return array Array containing all elements after applying callback.
 */
function exampleArrayMap(): void {
    $nums = [1, 2, 3];
    $squared = array_map(fn($n) => $n * $n, $nums);
    print_r($squared);
    // Output: [1, 4, 9]

    // Multiple arrays example: sum elements by position
    $a = [1, 2, 3];
    $b = [4, 5, 6];
    $sum = array_map(fn($x, $y) => $x + $y, $a, $b);
    print_r($sum);
    // Output: [5, 7, 9]
}
```

---

## `array_reduce()`

```php
/**
 * Iteratively reduces array to a single value using a callback.
 *
 * @param array $array Input array.
 * @param callable $callback Function to apply.
 *        Receives carry and current item.
 * @param mixed $initial Optional. Initial value of carry.
 * @return mixed Reduced value.
 */
function exampleArrayReduce(): void {
    $nums = [1, 2, 3, 4];

    // Sum of numbers
    $sum = array_reduce($nums, fn($carry, $item) => $carry + $item, 0);
    echo $sum; // Output: 10

    // Product of numbers
    $product = array_reduce($nums, fn($carry, $item) => $carry * $item, 1);
    echo $product; // Output: 24
}
```

---

## `array_search()`

```php
/**
 * Searches array for a given value and returns the corresponding key if found.
 *
 * @param mixed $needle The searched value.
 * @param array $haystack The array.
 * @param bool $strict Optional. If true, uses strict comparison (===).
 * @return mixed Key if found, false otherwise.
 */
function exampleArraySearch(): void {
    $fruits = ['apple', 'banana', 'cherry'];

    $key = array_search('banana', $fruits);
    echo $key; // Output: 1

    $keyStrict = array_search('1', [1, 2, 3], true);
    var_dump($keyStrict); // Output: bool(false)
}
```

---

## `in_array()`

```php
/**
 * Checks if a value exists in an array.
 *
 * @param mixed $needle Value to search for.
 * @param array $haystack Array to search in.
 * @param bool $strict Optional. If true, uses strict comparison.
 * @return bool True if found, false otherwise.
 */
function exampleInArray(): void {
    $fruits = ['apple', 'banana', 'cherry'];

    var_dump(in_array('cherry', $fruits)); // true
    var_dump(in_array('1', [1, 2, 3], true)); // false
}
```

---

## `array_keys()` and `array_values()`

```php
/**
 * Returns all the keys or values from an array.
 *
 * @param array $array Input array.
 * @param mixed $search_value Optional. If specified, only keys for this value are returned.
 * @param bool $strict Optional. If true, strict comparison used when searching.
 * @return array Array of keys or values.
 */
function exampleArrayKeysValues(): void {
    $assoc = ['a' => 1, 'b' => 2, 'c' => 1];

    $keys = array_keys($assoc); // ['a', 'b', 'c']
    print_r($keys);

    $keysForValue1 = array_keys($assoc, 1); // ['a', 'c']
    print_r($keysForValue1);

    $values = array_values($assoc); // [1, 2, 1]
    print_r($values);
}
```

---

## `array_column()`

```php
/**
 * Returns the values from a single column in the input array.
 *
 * @param array $input Multi-dimensional array (e.g., result set).
 * @param mixed $column_key Column of values to return.
 * @param mixed $index_key Optional. Column to use as keys for returned array.
 * @return array Array of values from column_key.
 */
function exampleArrayColumn(): void {
    $data = [
        ['id' => 1, 'name' => 'Alice'],
        ['id' => 2, 'name' => 'Bob'],
    ];

    $names = array_column($data, 'name');
    print_r($names);
    // Output: ['Alice', 'Bob']

    $indexedById = array_column($data, 'name', 'id');
    print_r($indexedById);
    // Output: [1 => 'Alice', 2 => 'Bob']
}
```

---

## `array_merge()` and `array_merge_recursive()`

```php
/**
 * Merges arrays into one.
 *
 * @param array ...$arrays Arrays to merge.
 * @return array Merged array.
 */
function exampleArrayMerge(): void {
    $a = ['a' => 1, 'b' => 2];
    $b = ['b' => 3, 'c' => 4];

    $merged = array_merge($a, $b);
    print_r($merged);
    // Output: ['a' => 1, 'b' => 3, 'c' => 4]

    $recursiveA = ['a' => ['x']];
    $recursiveB = ['a' => ['y']];
    $mergedRecursive = array_merge_recursive($recursiveA, $recursiveB);
    print_r($mergedRecursive);
    // Output: ['a' => ['x', 'y']]
}
```

---

## `array_slice()`

```php
/**
 * Extracts a slice of the array.
 *
 * @param array $array Input array.
 * @param int $offset Starting offset.
 * @param int|null $length Optional length of slice.
 * @param bool $preserve_keys Optional. Whether to preserve keys.
 * @return array Extracted slice.
 */
function exampleArraySlice(): void {
    $nums = [1, 2, 3, 4, 5];

    $slice = array_slice($nums, 1, 3);
    print_r($slice);
    // Output: [2, 3, 4]

    $slicePreserve = array_slice($nums, 1, 3, true);
    print_r($slicePreserve);
    // Output: [1 => 2, 2 => 3, 3 => 4]
}
```

---

## `array_splice()`

```php
/**
 * Removes/replaces a portion of an array.
 *
 * @param array &$array The input array (passed by reference).
 * @param int $offset Start position.
 * @param int|null $length Number of elements to remove.
 * @param array|null $replacement Optional. Replacement elements.
 * @return array Removed elements.
 */
function exampleArraySplice(): void {
    $nums = [1, 2, 3, 4, 5];

    $removed = array_splice($nums, 2, 2, [8, 9]);
    print_r($nums);
    // Output: [1, 2, 8, 9, 5]

    print_r($removed);
    // Output: [3, 4]
}
```

---

## `array_key_exists()`

```php
/**
 * Checks if a key or index exists in an array.
 *
 * @param mixed $key Key to check.
 * @param array $array Array to check in.
 * @return bool True if key exists, false otherwise.
 */
function exampleArrayKeyExists(): void {
    $assoc = ['foo' => 'bar'];

    if (array_key_exists('foo', $assoc)) {
        echo "Key 'foo' exists!";
    }
}
```

---

## `array_walk()` and `array_walk_recursive()`

```php
/**
 * Applies a callback to each element of the array.
 *
 * @param array &$array Array to walk.
 * @param callable $callback Function to apply.
 *        Signature: function(&$value, $key)
 * @param mixed $userdata Optional user data passed to callback.
 * @return bool True on success.
 */
function exampleArrayWalk(): void {
    $nums = [1, 2, 3];

    array_walk($nums, function (&$value, $key) {
        $value *= 2;
    });

    print_r($nums);
    // Output: [2, 4, 6]
}
```

---

### Summary of Key Differences

| Function       | Returns New Array? | Modifies In-place? | Callback Parameters       |
| -------------- | ------------------ | ------------------ | ------------------------- |
| `array_map`    | Yes                | No                 | Value(s)                  |
| `array_filter` | Yes                | No                 | Value or Value+Key        |
| `array_walk`   | No                 | Yes                | Value (by reference), Key |

