Let’s load up your mental backpack with some Big-O ammo for interviews. I’ll keep it concise but layered—like flashcards with footnotes—so you can review quickly and then drill deeper.

---

### What Big-O Measures

* **Definition:** Big-O notation describes the *upper bound* of an algorithm’s growth rate relative to input size `n`.
* **Purpose:** Ignore constants and small terms, focus on how runtime (or space) scales as `n → ∞`.
* **Interview framing:** They want to see if you can compare algorithms and reason about tradeoffs.

---

### Common Complexities

* **O(1)** – Constant time. Example: Accessing an array element by index.
* **O(log n)** – Logarithmic. Example: Binary search in a sorted array.
* **O(n)** – Linear. Example: Iterating through an array once.
* **O(n log n)** – “Linearithmic.” Example: Mergesort, Quicksort average case.
* **O(n²)** – Quadratic. Example: Double nested loop comparing every pair.
* **O(2^n)** – Exponential. Example: Naive recursion on subsets (like solving Traveling Salesman by brute force).
* **O(n!)** – Factorial. Example: Trying all permutations of `n`.

---

### Quick Memory Hooks

* `log n` shows up when you *halve the problem each step* (binary search, balanced trees).
* `n log n` is the “sorting tax” (efficient comparison-based sorting can’t beat it).
* `n²` screams “nested loops.”
* `2^n` and `n!` are the death zones—backtracking or brute force through subsets/perms.

---

### Space Complexity

* Similar reasoning but measures *extra memory*.
* Example: In-place quicksort = O(log n) space (recursion stack). Mergesort = O(n) space (extra arrays).

---

### Common Structures & Their Costs

* **Arrays**

  * Index access: O(1)
  * Search unsorted: O(n)
  * Insert at end: O(1) amortized
  * Insert in middle: O(n) (shift elements)
* **Hash Maps**

  * Insert, delete, lookup: O(1) average, O(n) worst (collisions)
* **Binary Search Trees (balanced)**

  * Insert, delete, search: O(log n)
* **Graphs**

  * BFS/DFS: O(V + E) (vertices plus edges)

---

### Interview Tips

1. **Be explicit about assumptions.** Say whether the data is sorted, whether you assume average vs worst case.
2. **Compare alternatives.** If you propose a hash map, mention the tradeoff vs array or tree.
3. **Watch nested loops.** If an inner loop doesn’t always run `n` times, calculate the sum (e.g., `1 + 2 + … + n = O(n²)`).
4. **Simplify expressions.** Drop constants: O(3n² + 100n) → O(n²).
5. **Big-O ≠ exact runtime.** It’s growth rate, not stopwatch time.

---

### Gotchas

* **Amortized complexity** (e.g., array resize in dynamic arrays).
* **Best vs worst vs average case.** Quicksort average = O(n log n), worst = O(n²).
* **Hidden constants.** Hash tables have O(1) average, but with big constant factors.

---

Think of Big-O as a compass, not a ruler. It points you toward scalability issues, but in interviews you’ll score points by explaining *why* the complexity makes sense, not just blurting “O(n log n).”

---

Do you want me to also make you a **cheat-sheet with mini examples of code snippets** (like “this loop → O(n²)”), so you can practice spotting them quickly?
