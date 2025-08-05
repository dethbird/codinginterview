# Interview Patterns: Merge Sort in PHP

## What is Merge Sort?

Merge Sort is a **divide-and-conquer** sorting algorithm. It divides the array into halves, recursively sorts them, and merges the sorted halves.

------

## Algorithm Steps

1. Divide the array into two halves.
2. Recursively sort each half.
3. Merge the two sorted halves into a single sorted array.

------

## Time Complexity

- **Best, Average, Worst:** O(n log n)
- Space Complexity: O(n) due to temporary arrays during merge.

------

## PHP Implementation

```php
function mergeSort(array $arr): array {
    if (count($arr) <= 1) {
        return $arr;
    }

    $mid = intdiv(count($arr), 2);
    $left = array_slice($arr, 0, $mid);
    $right = array_slice($arr, $mid);

    $left = mergeSort($left);
    $right = mergeSort($right);

    return merge($left, $right);
}

function merge(array $left, array $right): array {
    $result = [];
    $i = $j = 0;

    while ($i < count($left) && $j < count($right)) {
        if ($left[$i] <= $right[$j]) {
            $result[] = $left[$i++];
        } else {
            $result[] = $right[$j++];
        }
    }

    // Append remaining elements
    while ($i < count($left)) {
        $result[] = $left[$i++];
    }
    while ($j < count($right)) {
        $result[] = $right[$j++];
    }

    return $result;
}
```

------

## Usage Example

```php
$array = [5, 3, 8, 4, 2];
$sorted = mergeSort($array);
print_r($sorted);  // [2, 3, 4, 5, 8]
```

------

## Best Practices

- Use merge sort for stable sorting requirements.
- Understand recursive logic and base case.
- Be mindful of extra memory use due to arrays copying.

