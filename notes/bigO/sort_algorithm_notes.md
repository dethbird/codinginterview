Perfect—sorting algorithms are *the* playground for Big-O in interviews. I’ll give you a compact guide: what each algorithm does, its time/space complexity, and some easy pseudo-code for spotting patterns.

---

## Sorting Algorithms & Big-O

### 1. **Bubble Sort**

* **Idea:** Repeatedly swap adjacent elements if they’re in the wrong order.
* **Time:** O(n²) worst/average, O(n) best (already sorted with early exit).
* **Space:** O(1).
* **Pseudo-code:**

```text
for i = 0 to n-1:
    swapped = false
    for j = 0 to n-i-2:
        if arr[j] > arr[j+1]:
            swap(arr[j], arr[j+1])
            swapped = true
    if not swapped: break
```

* **Note:** Easy but impractical—teaching tool more than real-world use.

---

### 2. **Selection Sort**

* **Idea:** Repeatedly find the minimum element and put it at the front.
* **Time:** O(n²) always.
* **Space:** O(1).
* **Pseudo-code:**

```text
for i = 0 to n-1:
    minIndex = i
    for j = i+1 to n-1:
        if arr[j] < arr[minIndex]:
            minIndex = j
    swap(arr[i], arr[minIndex])
```

* **Note:** Fewer swaps than bubble, but same quadratic growth.

---

### 3. **Insertion Sort**

* **Idea:** Build a sorted subarray one item at a time by inserting elements in place.
* **Time:** O(n²) worst/average, O(n) best (nearly sorted).
* **Space:** O(1).
* **Pseudo-code:**

```text
for i = 1 to n-1:
    key = arr[i]
    j = i - 1
    while j >= 0 and arr[j] > key:
        arr[j+1] = arr[j]
        j = j - 1
    arr[j+1] = key
```

* **Note:** Great for small arrays or nearly sorted lists.

---

### 4. **Merge Sort**

* **Idea:** Divide array into halves, sort each recursively, then merge.
* **Time:** O(n log n) worst/average/best.
* **Space:** O(n) (extra arrays for merging).
* **Pseudo-code:**

```text
function mergeSort(arr):
    if length(arr) <= 1: return arr
    mid = n/2
    left = mergeSort(arr[0:mid])
    right = mergeSort(arr[mid:n])
    return merge(left, right)

function merge(left, right):
    result = []
    while left and right not empty:
        if left[0] <= right[0]:
            result.append(left.pop_front())
        else:
            result.append(right.pop_front())
    return result + left + right
```

* **Note:** Stable and predictable O(n log n).

---

### 5. **Quicksort**

* **Idea:** Pick a pivot, partition elements into < pivot and > pivot, then recurse.
* **Time:** Average O(n log n), worst O(n²) (bad pivot choices).
* **Space:** O(log n) average (recursion).
* **Pseudo-code:**

```text
function quickSort(arr):
    if length(arr) <= 1: return arr
    pivot = choosePivot(arr)
    left = [x for x in arr if x < pivot]
    mid  = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quickSort(left) + mid + quickSort(right)
```

* **Note:** Often fastest in practice, especially with randomized or median pivot.

---

### 6. **Heap Sort**

* **Idea:** Build a max-heap, repeatedly extract max and rebuild heap.
* **Time:** O(n log n) worst/average/best.
* **Space:** O(1).
* **Pseudo-code:**

```text
buildMaxHeap(arr)
for i = n-1 downto 1:
    swap(arr[0], arr[i])
    heapify(arr, 0, i)
```

* **Note:** Good worst-case guarantee, but not stable.

---

### 7. **Counting Sort** (Non-comparison)

* **Idea:** Count occurrences of each value, then reconstruct array.
* **Time:** O(n + k), where k = range of input values.
* **Space:** O(n + k).
* **Pseudo-code:**

```text
count = array of zeros of size k
for i in arr: count[i] += 1
output = []
for i = 0 to k-1:
    while count[i] > 0:
        output.append(i)
        count[i] -= 1
```

* **Note:** Only works for integers in limited range.

---

### 8. **Radix Sort** (Non-comparison)

* **Idea:** Sort numbers digit by digit using a stable sub-sort (like counting).
* **Time:** O(d*(n+k)), where d = digits, k = range of each digit.
* **Space:** O(n + k).
* **Note:** Great for integers/strings, but requires stable sub-sort.

---

### Complexity Cheat-Grid

| Algorithm      | Best       | Average    | Worst      | Space    | Stable |
| -------------- | ---------- | ---------- | ---------- | -------- | ------ |
| Bubble Sort    | O(n)       | O(n²)      | O(n²)      | O(1)     | Yes    |
| Selection Sort | O(n²)      | O(n²)      | O(n²)      | O(1)     | No     |
| Insertion Sort | O(n)       | O(n²)      | O(n²)      | O(1)     | Yes    |
| Merge Sort     | O(n log n) | O(n log n) | O(n log n) | O(n)     | Yes    |
| Quick Sort     | O(n log n) | O(n log n) | O(n²)      | O(log n) | No     |
| Heap Sort      | O(n log n) | O(n log n) | O(n log n) | O(1)     | No     |
| Counting Sort  | O(n+k)     | O(n+k)     | O(n+k)     | O(n+k)   | Yes    |
| Radix Sort     | O(d(n+k))  | O(d(n+k))  | O(d(n+k))  | O(n+k)   | Yes    |

---

This covers both the **big-O reasoning** and **pseudo-code recognition patterns** you’ll need in an interview.

Would you like me to also create a **flowchart-style decision aid** (e.g. “Is data mostly sorted? → use Insertion. Need guaranteed O(n log n)? → Merge/Heap.”) so you can use it like a mental map during the interview?
