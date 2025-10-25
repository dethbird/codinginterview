Absolutely — here’s a clean “gold answer” with explanations and tiny tests you can paste into your notes.

# 5) Retry with Exponential Backoff + Jitter

### What it does

`retry(fn, opts)` runs `fn()` until it succeeds or you run out of retries. Between attempts it waits using **exponential backoff** (min × factor^k), optionally with **full jitter** (random 0..delay). You can:

* control `retries`, `factor`, `min`, `max`, `jitter`
* decide which errors are retryable via `shouldRetry(err, attempt)`
* (bonus) pass an `AbortSignal` to cancel while sleeping or between attempts

---

### Drop-in code (`retry.js`)

```js
// retry.js
'use strict';

/**
 * Sleep for ms; if a signal is provided and aborts, reject with AbortError.
 */
function sleep(ms, signal) {
  if (ms <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortErr());

    const t = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(abortErr());
    };

    const cleanup = () => {
      clearTimeout(t);
      if (signal) signal.removeEventListener('abort', onAbort);
    };

    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

function abortErr() {
  const err = new Error('Operation aborted');
  err.name = 'AbortError';
  return err;
}

/**
 * Retry an async (or sync) function with exponential backoff and optional jitter.
 *
 * @param {Function} fn - function to invoke (can be sync or async). Called as fn({ attempt }).
 * @param {Object} opts
 * @param {number} [opts.retries=5] - number of *retries* after the initial attempt
 * @param {number} [opts.factor=2] - exponential factor
 * @param {number} [opts.min=100] - initial delay in ms
 * @param {number} [opts.max=2000] - maximum delay in ms
 * @param {boolean} [opts.jitter=false] - full jitter (0..delay)
 * @param {AbortSignal} [opts.signal] - optional AbortSignal
 * @param {(err:unknown, attempt:number)=>boolean} [opts.shouldRetry] - retry predicate
 * @param {(err:unknown, attempt:number, delay:number)=>void} [opts.onRetry] - hook for observability
 * @returns {Promise<any>}
 */
async function retry(fn, opts = {}) {
  const {
    retries = 5,
    factor = 2,
    min = 100,
    max = 2000,
    jitter = false,
    signal,
    shouldRetry = () => true,
    onRetry,
  } = opts;

  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error(`Invalid retries: ${retries}`);
  }
  if (min < 0 || max < 0 || factor <= 0) {
    throw new Error('min/max must be >=0 and factor > 0');
  }

  let attempt = 0; // 0-based: 0 is the first try, retries are after failures

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (signal?.aborted) throw abortErr();

    try {
      // Allow fn to inspect attempt count if desired
      return await Promise.resolve(fn({ attempt }));
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err, attempt + 1)) {
        throw err;
      }

      // Compute backoff for *this* wait before the next attempt.
      // attempt: 0 -> wait min * factor^0, 1 -> min * factor^1, etc.
      const base = Math.min(max, min * Math.pow(factor, attempt));
      const delay = jitter ? Math.floor(Math.random() * base) : base;

      onRetry?.(err, attempt + 1, delay);

      await sleep(delay, signal);
      attempt++;
    }
  }
}

module.exports = { retry };
```

---

### Why this passes tough tests

* **Errors vs abort:**

  * Any thrown/rejected error flows out **after retries exhausted**.
  * If `shouldRetry(err)` returns `false`, we stop immediately.
  * If `signal.aborted`, we reject with `AbortError` even while sleeping.

* **Timing:**

  * Backoff grows: `min * factor^k`, clamped at `max`.
  * **Full jitter**: random between `0..delay` to avoid thundering herd.

* **Sync throws:**

  * Wrapping with `Promise.resolve(fn())` normalizes sync/async functions.

* **Observability:**

  * `onRetry(err, attemptNumber, delay)` hook for logging/metrics.

---

### Tiny tests (copy/paste)

```js
// retry.test.js
'use strict';
const assert = require('assert/strict');
const { retry } = require('./retry');

const now = () => Date.now();

const flaky = (failures, value = 'ok') => {
  let left = failures;
  return async () => {
    if (left-- > 0) throw new Error('boom');
    return value;
  };
};

(async () => {
  // 1) Succeeds after retries (timing sanity)
  const t0 = now();
  const result = await retry(flaky(2, 42), { retries: 3, min: 50, factor: 2, jitter: false });
  const elapsed = now() - t0;
  assert.equal(result, 42);
  // waits: 50 (after 1st fail) + 100 (after 2nd fail) ~= 150ms total (+/- scheduler)
  assert.ok(elapsed >= 130 && elapsed < 400);

  // 2) Exhausted retries -> last error bubbles
  await assert.rejects(
    retry(flaky(3), { retries: 2, min: 10, jitter: false }),
    /boom/
  );

  // 3) shouldRetry predicate prevents retrying non-retryable errors
  let tried = 0;
  await assert.rejects(
    retry(async () => {
      tried++;
      const err = new Error('fatal');
      err.code = 'ENOTRETRY';
      throw err;
    }, {
      retries: 5,
      shouldRetry: (err) => err.code !== 'ENOTRETRY'
    }),
    /fatal/
  );
  assert.equal(tried, 1);

  // 4) Abort while sleeping
  const ac = new AbortController();
  const p = retry(flaky(5), { retries: 5, min: 1000, jitter: false, signal: ac.signal });
  setTimeout(() => ac.abort(), 50);
  await assert.rejects(p, (e) => e.name === 'AbortError');

  console.log('OK');
})();
```

---

### Usage examples

```js
const { retry } = require('./retry');

// Basic
await retry(() => fetchJSON(url), { retries: 4, min: 200, max: 2000, factor: 2, jitter: true });

// Only retry network-ish errors
await retry(doRequest, {
  retries: 5,
  shouldRetry: (err) => ['ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH'].includes(err.code),
  onRetry: (err, attempt, delay) => console.warn(`retry #${attempt} in ${delay}ms`, err.code)
});
```

---

### Takeaways

* **Exponential backoff + jitter** is standard for resilient clients (reduces synchronized retries).
* Always give callers control via a **retry predicate** and **AbortSignal**.
* Normalize sync/async tasks with `Promise.resolve` to handle sync throws uniformly.
