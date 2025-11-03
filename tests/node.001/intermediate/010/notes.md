Awesome—here’s a clean, fast “gold answer” you can drop into your notes, plus a tiny test block.

# 10) Simple LRU Cache

### What it does

Fixed-capacity cache with **O(1)** `get`, `set`, `has`. We’ll use a single `Map` and rely on its **insertion order**:

* Most-recently-used (MRU): the **end** of the map.
* Least-recently-used (LRU): the **first** key (`map.keys().next().value`).

Moving an entry to MRU = `map.delete(key)` then `map.set(key, value)` (both O(1)).

### Behavior choices

* `get(k)` → returns value or `undefined`; **also updates recency** when found.
* `set(k, v)` → overwrites if exists (and moves to MRU). If capacity exceeded, evicts LRU.
* `has(k)` → **does not** update recency (useful for checks).
* `max <= 0` → effectively disabled: `set()` becomes a no-op; `get()` returns `undefined`.

---

### 💎 Drop-in code (`lru.js`)

```js
// lru.js
'use strict';

class LRU {
  constructor(max = 100) {
    if (!Number.isInteger(max)) throw new Error('max must be an integer');
    this.max = max;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    // Move to MRU by re-inserting
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key, value) {
    if (this.max <= 0) return this; // disabled cache

    if (this.map.has(key)) {
      // Overwrite and move to MRU
      this.map.delete(key);
      this.map.set(key, value);
      return this;
    }

    // If adding a new key would exceed capacity, evict LRU
    if (this.map.size >= this.max) {
      const lruKey = this.map.keys().next().value; // first inserted = LRU
      // If max === 0 this is unreachable due to early return above
      if (lruKey !== undefined) this.map.delete(lruKey);
    }

    this.map.set(key, value);
    return this;
  }

  has(key) {
    return this.map.has(key); // does NOT affect recency
  }

  // (Nice-to-have) helpers for tests/inspection
  get size() {
    return this.map.size;
  }
}

module.exports = { LRU };
```

---

### 🧪 Tiny tests

```js
const assert = require('assert/strict');
const { LRU } = require('./lru');

// 1) Basic set/get + eviction
const c = new LRU(2);
c.set('a', 1).set('b', 2);
assert.equal(c.get('a'), 1);     // 'a' becomes MRU, 'b' is now LRU
c.set('c', 3);                   // evicts 'b'
assert.equal(c.has('b'), false);
assert.equal(c.get('a'), 1);
assert.equal(c.get('c'), 3);

// 2) Overwrite moves to MRU
const d = new LRU(2);
d.set('x', 1).set('y', 2);
d.set('x', 42);                  // overwrite + move to MRU, y becomes LRU
d.set('z', 3);                   // evicts 'y'
assert.equal(d.has('y'), false);
assert.equal(d.get('x'), 42);
assert.equal(d.get('z'), 3);

// 3) get() refreshes recency
const e = new LRU(2);
e.set('k1', 'A').set('k2', 'B');
e.get('k1');                     // k1 MRU, k2 LRU
e.set('k3', 'C');                // evicts k2
assert.equal(e.has('k2'), false);
assert.equal(e.has('k1'), true);
assert.equal(e.has('k3'), true);

// 4) zero capacity
const z =
```
