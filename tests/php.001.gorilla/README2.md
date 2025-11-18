You didn’t bomb them, you just got a very honest benchmark. That’s useful data. Let’s feed the brain some more reps.

Here are **5 fresh data-structure problems**, all in PHP flavor, roughly in “easy → medium” range. Solve them like a real test; then paste your answers and we’ll dissect.

---

## 1) Two Sum (Hashmap Warmup)

Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.

You may assume:

* exactly one solution
* you can’t use the same element twice

Order of the two indices doesn’t matter.

```php
<?php

/**
 * @param int[] $nums
 * @return int[]  // [i, j]
 */
function twoSum(array $nums, int $target): array
{
    // @todo
}
```

**Example:**

```php
twoSum([2, 7, 11, 15], 9)  // [0, 1]
```

---

## 2) Longest Substring Without Repeating Characters (Sliding Window + Hashmap)

Given a string `s`, find the length of the **longest substring** without repeating characters.

```php
<?php

function lengthOfLongestSubstring(string $s): int
{
    // @todo
}
```

**Examples:**

```php
lengthOfLongestSubstring("abcabcbb") === 3   // "abc"
lengthOfLongestSubstring("bbbbb")    === 1   // "b"
lengthOfLongestSubstring("pwwkew")   === 3   // "wke"
```

Hints (for your brain, not the test):

* Use a sliding window with two pointers (`$left`, `$right`).
* Use a hashmap of char → last seen index.

---

## 3) Remove N-th Node From End of List (Two Pointers + Linked List)

Given the head of a singly linked list, remove the **n-th node from the end** of the list and return the new head.

```php
<?php

class ListNode
{
    public function __construct(
        public int $val,
        public ?ListNode $next = null,
    ) {}
}

/**
 * @return ?ListNode
 */
function removeNthFromEnd(?ListNode $head, int $n): ?ListNode
{
    // @todo
}
```

Idea you’re aiming for:

* Use a “dummy” node pointing to head.
* Use two pointers (`fast`, `slow`).
* Move `fast` `n` steps ahead.
* Move both until `fast` hits null.
* Delete `slow->next`.

Edge case: remove the head itself.

---

## 4) Invert / Mirror a Binary Tree (Tree + Recursion)

Invert a binary tree so that left and right children of all nodes are swapped.

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

function invertTree(?TreeNode $root): ?TreeNode
{
    // @todo
}
```

**Example:**

Before:

```
    4
   / \
  2   7
 / \ / \
1  3 6  9
```

After:

```
    4
   / \
  7   2
 / \ / \
9  6 3  1
```

This is a nice clean recursion exercise.

---

## 5) Number of Islands (Grid + DFS/BFS)

You are given a 2D grid map of `'1'`s (land) and `'0'`s (water). Count the number of **islands**.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically (no diagonals).

```php
<?php

/**
 * @param string[][] $grid  // each cell is "0" or "1"
 */
function numIslands(array $grid): int
{
    // @todo
}
```

**Example:**

```text
11110
11010
11000
00000
```

→ 1 island

```text
11000
11000
00100
00011
```

→ 3 islands

You can:

* modify the grid in place (turn `'1'` into `'0'` when visited), or
* track a separate visited set.

Use DFS (recursive) or BFS (queue).

---

You don’t need to nail all five to “pass” in the real world. But if you can get through:

* 1 and 2 reliably → hashmaps / windows solid
* 3 and 4 → pointers + recursion solid
* 5 → graph-y thinking solid

Paste your PHP attempts for *any subset* of these and I’ll go line by line like a cranky hiring platform, but with fewer bugs.
