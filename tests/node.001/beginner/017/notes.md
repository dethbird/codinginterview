You’ve got the right instinct: the **thing to cache is the in-flight Promise itself**, not just the eventual value. That way, if 10 callers hit the same args before the first call resolves, they all await the same Promise (no stampede).

Here’s a clean implementation with:

* **Coalescing** (one Promise per key),
* **TTL** (expires after `ttlMs`),
* **Stable keying** (order-insensitive stringify for objects/arrays),
* **Rejection caching** (the rejection is cached until TTL expires, then a fresh call is allowed).

```js
// memoize-async.js
'use strict';

/**
 * Stable stringify that ignores property insertion order.
 * Handles primitives, arrays, plain objects; falls back to String(...) for others.
 */
function stableStringify(value) {
  const seen = new WeakSet();

  const walk = (v) => {
    if (v === null || typeof v !== 'object') {
      // primitives, functions, symbols, bigint, undefined
      if (typeof v === 'function') return `function:${v.name || 'anonymous'}`;
      if (typeof v === 'symbol') return v.toString();
      return v;
    }
    if (seen.has(v)) return '[Circular]';
    seen.add(v);

    if (Array.isArray(v)) return v.map(walk);

    // plain object: sort keys for order-insensitive equality
    const entries = Object.keys(v).sort().map(k => [k, walk(v[k])]);
    return { __obj__: entries }; // tag shape to avoid array collision
  };

  return JSON.stringify(walk(value));
}

function makeKey(args) {
  // Build a single key from all arguments; spread to keep arity differences distinct
  return args.length === 1 ? stableStringify(args[0])
                           : stableStringify(args);
}

/**
 * memoizeAsync(fn, ttlMs)
 * Caches Promise results by argument key for ttlMs. Rejections are also cached
 * until TTL expiry to avoid thundering herds on failing backends.
 */
function memoizeAsync(fn, ttlMs = 1000) {
  const cache = new Map(); // key -> { expires:number, promise:Promise }

  function getFresh(args, key) {
    const expires = Date.now() + ttlMs;
    const promise = (async () => fn(...args))();
    cache.set(key, { expires, promise });

    // Optional: if you *never* want to cache rejections, uncomment below:
    // promise.catch(() => { if (cache.get(key)?.promise === promise) cache.delete(key); });

    return promise;
  }

  return function memoized(...args) {
    const key = makeKey(args);
    const hit = cache.get(key);

    if (hit && hit.expires > Date.now()) {
      return hit.promise; // coalesce callers on the same in-flight or settled promise
    }

    // Expired or missing -> create a fresh promise
    if (hit) cache.delete(key);
    return getFresh(args, key);
  };
}

module.exports = { memoizeAsync };
```

### Why the Promise goes in the cache

* **Concurrency:** As soon as we start the call, we stash the *Promise* so all other callers for that key can reuse it rather than triggering more work.
* **Rejections:** Caching the rejected Promise prevents a failing upstream from being hammered; after TTL, a new attempt is made.
* **TTL:** We store `expires` alongside the Promise. Calls within the TTL reuse it; after that, it’s recomputed.

### Tiny test sketch (what your tests will probe)

```js
const { memoizeAsync } = require('./memoize-async');

test('coalesces concurrent calls', async () => {
  let calls = 0;
  const fn = jest.fn(async (x) => {
    calls++;
    await new Promise(r => setTimeout(r, 20));
    return x * 2;
  });

  const m = memoizeAsync(fn, 1000);
  const [a, b, c] = await Promise.all([m(2), m(2), m(2)]);
  expect(a).toBe(4);
  expect(b).toBe(4);
  expect(c).toBe(4);
  expect(calls).toBe(1); // one underlying call
});

test('expires after TTL', async () => {
  let calls = 0;
  const fn = async (x) => { calls++; return x };
  const m = memoizeAsync(fn, 10);

  await m('k');
  await new Promise(r => setTimeout(r, 15));
  await m('k');

  expect(calls).toBe(2);
});

test('order-insensitive keys', async () => {
  let calls = 0;
  const fn = async (o) => { calls++; return JSON.stringify(o) };
  const m = memoizeAsync(fn, 1000);

  await m({ a: 1, b: 2 });
  await m({ b: 2, a: 1 });
  expect(calls).toBe(1);
});

test('rejection cached until TTL', async () => {
  let calls = 0;
  const fn = async () => { calls++; throw new Error('nope'); };
  const m = memoizeAsync(fn, 50);

  await expect(m(1)).rejects.toThrow('nope');
  await expect(m(1)).rejects.toThrow('nope');
  expect(calls).toBe(1);

  await new Promise(r => setTimeout(r, 60));
  await expect(m(1)).rejects.toThrow('nope');
  expect(calls).toBe(2);
});
```

If your spec says “don’t cache rejections,” flip on the commented `catch` that deletes the entry on failure. Otherwise, the above is a solid, battle-ready memoizer for async work. Next level would be optional **maxSize + LRU** eviction, but for this kata the Map + TTL is perfect.
