**parallel-vs-series.md**

# Parallel vs Series (Concurrency Patterns in Node)

## 📌 Definition

- **Series (sequential)**: tasks run **one after another**, each waits for the previous to finish.
- **Parallel (concurrent)**: tasks start **together**; results resolve as they complete. In Node this means concurrent **I/O**, not CPU.
- **Limited concurrency**: cap how many tasks run at once (e.g., 5 at a time) to avoid rate limits, timeouts, or DB pool exhaustion.

------

## When to use what

- **Series**: tasks must happen in order (migrations, “A depends on B”).
- **Parallel**: independent network/file operations for speed.
- **Limited concurrency**: external API rate limits, DB connection pools, memory pressure.

------

## Series with Promises / async–await

```js
// Runs strictly one by one (keeps ordering and simplifies error handling)
async function processInSeries(items, doWork) {
  for (const item of items) {
    await doWork(item);
  }
}

// Real-world: ordered ETL steps where each step uses previous output
await processInSeries(stepList, async (step) => {
  await step.run(); // e.g., ALTER TABLE then populate column then create index
});
```

**Notes**

- Simpler to reason about.
- Slow if steps are independent.

------

## Parallel with Promises

```js
// All kick off at once; fail-fast behavior
async function processInParallel(items, doWork) {
  const promises = items.map((x) => doWork(x));
  return Promise.all(promises); // rejects on first failure
}

// Real-world: fetch 10 independent resources from internal services
await processInParallel(endpoints, (url) => fetch(url).then(r => r.json()));
```

**Parameters (core combinators)**

- `Promise.all(iterable)` → resolves to array of values; **rejects on first error**.
- `Promise.allSettled(iterable)` → resolves to array of `{status, value|reason}`; **no throw**.
- `Promise.any(iterable)` → resolves with **first fulfilled**; rejects with `AggregateError` if all fail.
- `Promise.race(iterable)` → settles on **first settled** (fulfilled or rejected).

------

## Limited concurrency (no deps)

### Minimal “pool” / semaphore

```js
// Limit concurrent tasks to `limit` without extra libs
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  let active = 0;
  let resolveAll, rejectAll;

  const done = new Promise((res, rej) => (resolveAll = res, rejectAll = rej));

  function launch() {
    while (active < limit && i < items.length) {
      const index = i++;
      active++;
      Promise.resolve(worker(items[index], index))
        .then((val) => (results[index] = val))
        .catch(rejectAll)
        .finally(() => {
          active--;
          if (results.length === items.length && i >= items.length && active === 0) {
            resolveAll(results);
          } else {
            launch();
          }
        });
    }
  }
  launch();
  return done;
}

// Real-world: 5-at-a-time API calls to avoid 429s
await mapLimit(userIds, 5, async (id) => {
  const res = await fetch(`https://api.example.com/users/${id}`);
  if (!res.ok) throw new Error(`Fetch failed for ${id}`);
  return res.json();
});
```

**Why this matters**: Keeps your service stable under load and plays nice with partners’ rate limits.

------

## Handling failures intentionally

### Collect successes and errors (don’t fail fast)

```js
const results = await Promise.allSettled(items.map(doWork));
const successes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);

// Real-world: batch import — store what succeeded, log failures for retry
```

### First success wins

```js
// Real-world: try primary region then failover regions
const data = await Promise.any(regionEndpoints.map(url => fetch(url).then(r=>r.json())));
```

### Timeouts + cancellation (robust parallelism)

```js
import { setTimeout as sleep } from 'node:timers/promises';

async function withTimeout(promise, ms) {
  const ac = new AbortController();
  const timer = sleep(ms, null, { signal: ac.signal }).then(() => { throw new Error('Timeout'); });
  try {
    const res = await Promise.race([promise, timer]);
    ac.abort(); // cancel timer
    return res;
  } finally {
    ac.abort();
  }
}

// Real-world: cap external API latency per call (e.g., 2s)
const data = await withTimeout(fetch(url), 2000);
```

------

## DB-specific considerations

- Most DB clients use a **connection pool** (e.g., `pg.Pool({ max: 10 })`). If you fire 100 queries at once, they queue at the pool—latency and memory climb.
- Prefer **limited concurrency** that matches your pool size (or a small multiple).

```js
import { Pool } from 'pg';
const pool = new Pool({ max: 10 });

await mapLimit(rows, 8, async (row) => {
  await pool.query('INSERT INTO events(payload) VALUES ($1)', [row]);
});
```

------

## Ordered but non-blocking (pipeline)

Sometimes you need **preserve input order in output** but still run concurrently:

```js
async function mapLimitOrdered(items, limit, worker) {
  const results = new Array(items.length);
  await mapLimit(items, limit, async (item, i) => {
    results[i] = await worker(item, i);
  });
  return results;
}
```

------

## Backpressure-aware batching

- Batch writes/requests to reduce overhead:

```js
const BATCH = 100;
for (let i = 0; i < items.length; i += BATCH) {
  const slice = items.slice(i, i + BATCH);
  // Run each batch in parallel, batches in series (or with a pool)
  await Promise.all(slice.map(doWork));
}
```

- **Real-world**: Upsert thousands of rows in chunks to keep latency predictable.

------

## Callback style equivalents (legacy code)

```js
const async = require('async'); // if allowed in legacy repos

async.series([
  cb => step1(cb),
  cb => step2(cb)
], done);

async.parallelLimit([
  cb => taskA(cb),
  cb => taskB(cb),
  cb => taskC(cb)
], 5, done);
```

*If you can’t add deps, write a tiny `mapLimit` like above and wrap callback APIs with `util.promisify`.*

------

## CPU-bound caveat

“Parallel” I/O is fine. **CPU-heavy** work (zipping, image transforms, crypto at scale) will block the event loop.

- Use **Worker Threads** or move work off-process (queue/service) if CPU is the bottleneck.

------

## ✅ Interview Tips

- Explain **why** you’d use `Promise.allSettled` vs `Promise.all`.
- Show a **custom concurrency limiter**; discuss rate limits & pool sizes.
- Mention **timeouts/cancellation** and **batching** to be production-safe.
- Call out that Node’s “parallel” is cooperative I/O concurrency; CPU needs workers.

------

Next up: **abortcontroller-cancellation.md** (cancellable operations for fetch, timers, and your own APIs, plus graceful shutdown patterns).



# mapLimit

Short answer: **no**—`mapLimit` isn’t built into Node. I wrote that tiny helper to cap concurrency. It’s a common pattern (and name) borrowed from the `async` library’s `mapLimit`.

### What it is

A utility that **maps over an array but only runs N tasks at a time** (e.g., 5 concurrent fetches instead of 500). Useful for API rate limits, DB pool limits, and memory control.

### Production-ready options (pick one)

- **`p-limit`** (tiny, popular): create a limiter and wrap your tasks.
- **`p-map`**: like `Array.map` with a `concurrency` option.
- **`async`** (callback-era but still used): `async.mapLimit`.
- **Bluebird**: `Promise.map(items, fn, { concurrency: 5 })`.

### Quick snippets for your notes

#### Minimal TypeScript helper (drop-in)

/**

- mapLimit: Run worker over items with at most `limit` concurrent executions.
- @param items Array of inputs
- @param limit Max concurrent tasks (>0)
- @param worker Async function (item, index) => result
- @returns Promise of results in input order
   */

```ts
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  let active = 0;

  return new Promise<R[]>((resolve, reject) => {
    const launch = () => {
      while (active < limit && i < items.length) {
        const idx = i++;
        active++;
        Promise.resolve(worker(items[idx], idx))
          .then((val) => (results[idx] = val))
          .then(() => {
            active--;
            if (i >= items.length && active === 0) resolve(results);
            else launch();
          })
          .catch(reject); // fail-fast; swap to collect errors if desired
      }
    };
    launch();
  });
}
```

**Usage:**

```ts
const data = await mapLimit(userIds, 5, async (id) => {
  const res = await fetch(`https://api.example.com/users/${id}`);
  if (!res.ok) throw new Error(`Failed for ${id}`);
  return res.json();
});
```

#### Using `p-limit` (recommended)

```ts
import pLimit from 'p-limit';

const limit = pLimit(5);
const results = await Promise.all(
  userIds.map((id) => limit(async () => {
    const res = await fetch(`https://api.example.com/users/${id}`);
    if (!res.ok) throw new Error(`Failed for ${id}`);
    return res.json();
  }))
);
```

#### Using `async`’s `mapLimit`

```js
const asyncLib = require('async');

asyncLib.mapLimit(userIds, 5, (id, cb) => {
  fetch(`https://api.example.com/users/${id}`)
    .then(r => r.json())
    .then(d => cb(null, d))
    .catch(cb);
}, (err, results) => {
  if (err) console.error(err);
  else console.log(results);
});
```

If you want, I can add a **`mapLimitSettled`** variant (collect successes + errors) to your notes. Ready to continue to **`abortcontroller-cancellation.md`**?