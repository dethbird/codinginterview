**timers-nexttick-setimmediate.md**

# Timers: `setTimeout`, `setInterval`, `setImmediate`, `process.nextTick`

## 📌 Definition

Node.js gives you several scheduling tools with **different queues and priorities**:

- **`setTimeout(fn, ms, ...args)`** – run `fn` after *at least* `ms` milliseconds (Timers phase).
- **`setInterval(fn, ms, ...args)`** – run `fn` every `ms` milliseconds (Timers phase).
- **`setImmediate(fn, ...args)`** – run `fn` **after the current poll phase** (Check phase).
- **`process.nextTick(fn, ...args)`** – run `fn` **before** the event loop continues to the next phase (microtask-like).
- **`queueMicrotask(fn)`** – standard microtask queue; similar timing to `nextTick` (runs after current task, before I/O/timers).
- **`timers/promises`** – promise-based timers with optional **`AbortSignal`** support.

> ⚠️ `0` ms doesn’t mean “now.” Timers run when their phase comes around; there’s always overhead and clamping.

------

## 📋 API Reference & Parameters

### `setTimeout(callback, delay, ...args)`

Schedules `callback` once after at least `delay` ms.

- **callback**: function to invoke.
- **delay** *(number)*: milliseconds (minimum wait; not exact).
- **...args**: passed to `callback`.
- **Returns**: a `Timeout` object with `.ref()`/`.unref()`.

**Companions:** `clearTimeout(handle)`

**Notes:**

- `.unref()` lets the process exit if this is the only pending work.
- `delay` is clamped by system timer resolution and event loop load.

------

### `setInterval(callback, delay, ...args)`

Runs `callback` repeatedly every ~`delay` ms.

- **Returns**: an `Interval` (same shape as `Timeout`).
- **Companion:** `clearInterval(handle)`

**Notes:**

- Intervals can drift under load—don’t use for precise scheduling.
- Consider scheduling next run manually if you need “run N ms after completion.”

------

### `setImmediate(callback, ...args)`

Queues `callback` to run **after I/O callbacks** in the Check phase.

- Useful to **yield** after doing some synchronous work so I/O can proceed.
- **Returns**: an `Immediate` with `.ref()`/`.unref()`.
- **Companion:** `clearImmediate(handle)`

------

### `process.nextTick(callback, ...args)`

Executes `callback` **before** the event loop continues (runs right after the current JS stack unwinds).

- **Danger:** Overuse can **starve** the event loop.
- Great for deferring a callback to maintain API semantics (e.g., always async).

------

### `queueMicrotask(callback)`

Standards-based microtask; runs after the current task completes and before timers/I/O.

- Prefer this in library code where you don’t want Node-specific `nextTick`.

------

### `timers/promises`

Promise-friendly timers.

```js
import { setTimeout as sleep, setInterval } from 'node:timers/promises';

await sleep(200); // pauses async function ~200ms

for await (const _ of setInterval(1000, undefined, { ref: false })) {
  // async interval loop; use break when done
  break;
}
```

Options can include `{ signal, ref }`:

- **signal** *(AbortSignal)*: cancel the pending sleep/interval.
- **ref** *(boolean)*: `false` acts like `.unref()`.

------

## 🔬 Execution Ordering (Common Pitfalls)

- In a plain script:
  - `process.nextTick`/`queueMicrotask` → **before** timers/immediate.
  - `setTimeout(fn, 0)` vs `setImmediate(fn)`:
    - After an I/O callback (e.g., inside `fs.readFile`), **`setImmediate` tends to run before** `setTimeout(..., 0)`.
    - Outside I/O, the order between timeout(0) and immediate is **not guaranteed**; don’t rely on it.

```js
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  // Typically: 'immediate' then 'timeout'
});
```

------

## 🛠 Real-World Patterns & Examples

### 1) **Yield to the event loop** to keep APIs responsive

```js
// Heavy synchronous batch split into chunks:
function processLargeArray(items) {
  const CHUNK = 5000;

  function processChunk(start = 0) {
    const end = Math.min(start + CHUNK, items.length);
    for (let i = start; i < end; i++) {
      // CPU-bound work here
    }
    if (end < items.length) {
      setImmediate(() => processChunk(end)); // yield, let I/O run
    }
  }
  processChunk();
}
```

**Why:** Prevents blocking request handling in a server while crunching data.

------

### 2) **Ensure async consistency** in library APIs

```js
function getConfig(cb) {
  try {
    const cfg = loadConfigSync();
    // Always async callback even if we already have the data:
    process.nextTick(cb, null, cfg);
  } catch (err) {
    process.nextTick(cb, err);
  }
}
```

**Why:** Callers can safely set up `try/catch`/event handlers after calling your function.

------

### 3) **Debounce with timers** (e.g., CLI input or webhook bursts)

```js
let timer;
function onBurstingEvents(payload) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    flushBatchToDB(); // write once per idle period
  }, 300);
}
```

**Why:** Avoids hammering your DB with a write per event.

------

### 4) **Self-correcting intervals** (reduce drift)

```js
const INTERVAL = 1000;
let next = Date.now() + INTERVAL;

function tick() {
  // do work...
  next += INTERVAL;
  const delay = Math.max(0, next - Date.now());
  setTimeout(tick, delay);
}
setTimeout(tick, INTERVAL);
```

**Why:** `setInterval` drifts if work takes variable time; this approach aims for fixed cadence.

------

### 5) **Abortable sleep** in async workflows

```js
import { setTimeout as sleep } from 'node:timers/promises';

const ac = new AbortController();
setTimeout(() => ac.abort(), 100); // cancel if too slow

try {
  await sleep(1000, undefined, { signal: ac.signal });
  console.log('Done waiting');
} catch (err) {
  console.log('Sleep aborted');
}
```

**Why:** Robust backoffs and retries that don’t hang during shutdown.

------

### 6) **Let the process exit** with `.unref()`

```js
const handle = setTimeout(() => {
  // housekeeping that isn't critical
}, 60_000);

handle.unref(); // process can exit even if this timer is pending
```

**Why:** Don’t keep containers alive for non-essential delayed work.

------

## ✅ Interview Tips

- Be ready to **explain ordering** differences between `nextTick`, microtasks, timeouts, and immediates.
- Know **when to use `setImmediate`** (post-I/O) vs **`setTimeout(..., 0)`** (timers phase).
- Mention **`.unref()`/`.ref()`** for process-liveness control.
- Show awareness of **drift** and backpressure—tie it to real ops concerns.

------

Next up: **parallel-vs-series.md** (running tasks concurrently vs sequentially with callbacks, promises, and async/await, plus real-world batching, pooling, and `Promise.allSettled`/`Promise.any` gotchas).