Yeah, for that posting it’s *very* likely they’ll either:

* let you pick any language and silently judge you for not picking PHP 😈, or
* explicitly give you PHP in the browser.

Either way, prepping in PHP is the move.

I’ll give you a **PHP-flavored mock data structures test** that matches the vibe of that role: OOP, clean code, data structures, and thinking in terms of robustness.

---

## Mock PHP Data Structures Assessment

Assume **75 minutes total**.
You can use **plain PHP 8+**, no frameworks, no external libraries.

---

### Problem 1 — Singly Linked List Utilities

Implement a simple **singly linked list** in PHP and a couple of utility functions.

#### a) Node + LinkedList classes

```php
<?php

class ListNode
{
    public function __construct(
        public int $value,
        public ?ListNode $next = null,
    ) {}
}

class LinkedList
{
    public ?ListNode $head = null;

    public function __construct(array $values = [])
    {
        // @todo: build a list from $values (append in order)
    }

    public function toArray(): array
    {
        // @todo: return all node values in order
    }

    public function pushFront(int $value): void
    {
        // @todo: insert at the beginning in O(1)
    }

    public function reverse(): void
    {
        // @todo: reverse the list in-place, O(n), O(1) extra space
    }
}
```

#### b) Requirements

* `new LinkedList([1,2,3])` → internal structure: 1 → 2 → 3
* `pushFront(0)` → 0 → 1 → 2 → 3
* `reverse()` → 3 → 2 → 1 → 0
* `toArray()` returns `[3,2,1,0]` for that example.

**What this tests:** pointers/references, iterative logic, null handling.

---

### Problem 2 — First Non-Repeating Character (Associative Arrays / Hash Map)

Write a function that returns the **index** of the first non-repeating character in a string. Return `-1` if none.

```php
<?php

function firstUniqueChar(string $s): int
{
    // @todo
}
```

#### Examples

```php
firstUniqueChar("leetcode")      === 0   // 'l'
firstUniqueChar("loveleetcode")  === 2   // 'v'
firstUniqueChar("aabb")          === -1
```

#### Requirements

* **Time complexity:** O(n)
* **Space:** O(1) with respect to input alphabet (you can assume ASCII or UTF-8 byte-based, they won’t be picky).
* Use PHP’s associative arrays or `SplObjectStorage` if you’re feeling fancy, but arrays are fine.

**What this tests:** using hash maps / dictionaries in PHP, linear scans, edge cases.

---

### Problem 3 — Validate Brackets (Stack)

Implement a validator for a string containing only `()[]{}`. Return `true` if:

1. Every opener has a matching closer of the same type.
2. Closing order is correct.

```php
<?php

function isValidBrackets(string $s): bool
{
    // @todo
}
```

#### Examples

```php
isValidBrackets("()")        === true
isValidBrackets("()[]{}")    === true
isValidBrackets("(]")        === false
isValidBrackets("([)]")      === false
isValidBrackets("{[]}")      === true
```

#### Hint

Use an array as a **stack**:

* `array_push($stack, $ch)` to push
* `array_pop($stack)` to pop

**What this tests:** stack usage, control flow, mapping open/close brackets.

---

### Problem 4 — Binary Tree Level-Order Traversal (Queue / BFS)

You’re given a binary tree. Return an array of levels, each being an array of node values.

#### Tree structure

```php
<?php

class TreeNode
{
    public function __construct(
        public int $val,
        public ?TreeNode $left = null,
        public ?TreeNode $right = null,
    ) {}
}
```

#### Function

```php
<?php

/**
 * @return int[][]
 */
function levelOrder(?TreeNode $root): array
{
    // @todo: BFS using a queue
}
```

#### Example

Given:

```
      1
    /   \
   2     3
  / \     \
 4   5     6
```

Return:

```php
[
    [1],
    [2, 3],
    [4, 5, 6],
]
```

**What this tests:** queue semantics, BFS, null checks, nested arrays.

---

### Problem 5 — K-th Largest in a Stream (Min-Heap / SplPriorityQueue)

Design a class that tracks the **k-th largest number** in a stream of integers.

```php
<?php

class KthLargest
{
    private int $k;

    // @var SplPriorityQueue  // min-heap simulated via negative priority or custom compare
    private SplPriorityQueue $heap;

    public function __construct(int $k, array $initial = [])
    {
        // @todo: initialize $k and $heap, insert initial values
    }

    public function add(int $val): int
    {
        // @todo: add value, maintain only k largest in the heap
        // return current k-th largest
    }
}
```

#### Example

```php
$kth = new KthLargest(3, [4, 5, 8, 2]);

$kth->add(3); // returns 4
$kth->add(5); // returns 5
$kth->add(10); // returns 5
$kth->add(9); // returns 8
$kth->add(4); // returns 8
```

#### Constraints

* Maintain **O(log k)** per `add` by keeping a **min-heap** of size at most `k`.
* In PHP, `SplPriorityQueue` is a **max-heap** by default, so you can:

  * Store **negative** priorities, or
  * Extend `SplPriorityQueue` and flip compare.

**What this tests:** using SPL data structures, thinking in terms of heap behavior, not just arrays.

---

### Tiny Conceptual Section (What They Might Ask in MCQ Form)

You don’t need to write these now, but be ready to answer stuff like:

1. **What’s the average complexity of `array_push` on a PHP array?**
   → amortized O(1).

2. **What’s the complexity of `array_shift` on a PHP array?**
   → O(n), because everything is reindexed.

3. **When would you choose an associative array vs. a custom object graph (like a tree)?**
   → Associative array for flat or shallow key/value lookups; object graph/tree when structure/relationships matter (hierarchies, traversals, invariants).

4. **Why use `SplDoublyLinkedList` or `SplQueue` instead of a bare array for a queue?**
   → Proper semantics, O(1) inserts/removals at both ends, clearer intent.

---

If you want, next step is: you pick **one or two of these**, implement in PHP like you’re in the test, paste here, and I’ll go through them like an evil but fair grader and point out exactly where an online assessment would ding or reward you.
