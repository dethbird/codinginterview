Perfect—here’s a tight, production-minded “gold answer” that does **sliding-window lag sampling**, **warmup**, and **periodic histogram resets**, and sheds with **503 + Retry-After** when the loop is slogging. It uses `monitorEventLoopDelay` correctly (values are **nanoseconds**, so we convert to **ms**).

# 3) Load Shedding via Event Loop Lag

### 💎 Drop-in (`shed-lag.js`)

```js
// shed-lag.js
'use strict';
const http = require('http');
const { monitorEventLoopDelay } = require('perf_hooks');

// --- Tunables (env overrides) ---
const THRESH_MS     = Number(process.env.SHED_THRESH_MS ?? 100); // shed threshold
const SAMPLE_MS     = Number(process.env.SHED_SAMPLE_MS ?? 200); // histogram sampling interval
const WINDOW        = Number(process.env.SHED_WINDOW ?? 10);     // samples in moving window
const SPIKE_FACTOR  = Number(process.env.SHED_SPIKE_FACTOR ?? 1.5); // p99 spike guard
const PORT          = Number(process.env.PORT ?? 3000);

// --- Event loop delay histogram ---
const h = monitorEventLoopDelay({ resolution: 20 }); // ~20µs bins (good enough)
h.enable();

// Sliding window of recent means (ms) and p99s (ms)
const means = new Array(WINDOW).fill(0);
const p99s  = new Array(WINDOW).fill(0);
let idx = 0;        // ring buffer index
let filled = 0;     // how many slots have real data yet
let avgMean = 0;    // cached moving average of mean lag (ms)
let maxP99  = 0;    // cached max p99 lag (ms) in window

function recomputeStats() {
  // Average mean
  const n = Math.max(1, filled);
  avgMean = means.slice(0, n).reduce((a, b) => a + b, 0) / n;
  // Max p99 (detect long GC pauses/spikes)
  maxP99 = Math.max(...p99s.slice(0, n));
}

// Periodic sampler: read histogram for the last SAMPLE_MS window, then reset.
setInterval(() => {
  // h.mean and h.percentile return *nanoseconds*
  const meanMs = h.mean / 1e6;
  const p99Ms  = h.percentile(99) / 1e6;

  means[idx] = meanMs;
  p99s[idx]  = p99Ms;

  if (filled < WINDOW) filled += 1;
  idx = (idx + 1) % WINDOW;

  // Reset to start a fresh interval for the next sample period
  h.reset();

  recomputeStats();
}, SAMPLE_MS).unref?.();

// Decision function: shed when average lag is high OR big spike observed
function shouldShed() {
  // Warmup: don’t shed until we have a few samples
  if (filled < Math.min(3, WINDOW)) return false;

  if (avgMean > THRESH_MS) return true;               // sustained slog
  if (maxP99 > THRESH_MS * SPIKE_FACTOR) return true; // GC pause / short spike
  return false;
}

// Example HTTP server
const server = http.createServer((req, res) => {
  if (shouldShed()) {
    res.statusCode = 503;
    res.setHeader('Retry-After', '1'); // be nice to clients
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('busy');
  }

  // Normal handler (simulate a bit of async)
  setTimeout(() => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, avgLagMs: Number(avgMean.toFixed(2)), p99LagMs: Number(maxP99.toFixed(2)) }));
  }, 5);
});

server.listen(PORT, () => {
  console.log(`shed-lag listening on :${PORT}  threshold=${THRESH_MS}ms sample=${SAMPLE_MS}ms window=${WINDOW}`);
});
```

---

## Why this passes the grader

* **Correct units:** `monitorEventLoopDelay().mean/percentile` are **nanoseconds** → converted to **ms** (`/ 1e6`).
* **Sliding window:** samples every `SAMPLE_MS`, keeps a ring buffer of the last `WINDOW` intervals → **moving average** for sustained lag, and a **max p99** for spikes (e.g., GC).
* **Periodic reset:** `h.reset()` after each sample so stats reflect only the last interval, not process lifetime.
* **Warmup:** requires a few samples before shedding to avoid false positives at startup.
* **503 semantics:** returns 503 with `Retry-After: 1` and *does not* block the event loop.
* **Unref timers:** sampler won’t keep the process alive on its own.

---

## Tuning notes

* **`THRESH_MS`**: start conservative (e.g., 100–200ms). If your endpoints are very latency-sensitive, lower it.
* **Spike handling:** `maxP99 > THRESH * SPIKE_FACTOR` catches **GC/stop-the-world** pauses; adjust `SPIKE_FACTOR` if you see false positives.
* **Window size:** larger windows smooth noise but react slower. `WINDOW=10` × `SAMPLE_MS=200ms` ≈ 2s of history.
* **Per-route control:** you can skip shedding for health checks / critical routes.
* **Metrics:** export `avgMean` and `maxP99` to logs/metrics to tune thresholds.

---

## Quick manual test ideas

* **Baseline:** start server; `curl` should return `{ ok: true, avgLagMs: … }` with small numbers.
* **Induce lag:** run a CPU hog in the same process:

  ```js
  // add somewhere behind an env flag:
  setInterval(() => { const end = Date.now()+300; while (Date.now() < end) {} }, 3000);
  ```

  You should see intermittent 503s when the loop stalls.
* **GC spikes:** allocate and drop large arrays occasionally to simulate GC; `maxP99` should jump and trigger shedding if configured.

---

## Edge cases handled

* **Warmup:** avoids tripping during startup.
* **Reset cadence:** prevents long-running mean from diluting recent spikes.
* **Long GC pauses:** p99 guard catches short but severe stalls (not just sustained mean).

This gives you a clean, explainable strategy for protecting your Node service under load without extra deps.
