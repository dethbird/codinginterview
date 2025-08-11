Heck yes—let’s get your Node.js reps in. Here’s a set of short, beginner-friendly practice problems that mimic what real coding screens poke at: stdin/stdout, fs, http, async, and a dash of data wrangling. Each one has a clear goal, tiny starter snippet, and what it’s testing. No answers included (yet); when you want hints, I’ll nudge—not spoil.

# Beginner Node.js Practice Set

------

## 1) Sum the Numbers (stdin)

**Goal:** Read `N` then `N` integers and print their sum.
 **Tests:** stdin parsing, basic loops, types.

**Input (example)**

```
5
10 3 -2 4 5
```

**Output**

```
20
// sum-stdin.js
'use strict';

const fs = require('fs');

const input = fs.readFileSync(0, 'utf8').trim().split(/\s+/);
let idx = 0;
const next = () => input[idx++];

const n = Number(next());
// TODO: read n numbers and compute sum
console.log(/* sum */);
```

**Edge cases:** extra spaces/newlines, `n=0`, negative numbers.
 **Hint:** Loop `n` times, coerce with `Number()`.

------

## 2) CSV Stats

**Goal:** Read one line of comma-separated numbers and print `min max avg` (avg rounded to 2 decimals).
 **Tests:** string splitting, numeric coercion, array reducers.

```js
// csv-stats.js
'use strict';
const fs = require('fs');

const line = fs.readFileSync(0, 'utf8').trim();
// TODO: parse into numbers
// TODO: compute min, max, avg to 2 decimals
console.log(/* `${min} ${max} ${avg}` */);
```

**Edge cases:** empty values, stray spaces, non-numeric -> ignore or throw (your call; document decision).

------

## 3) Unique Word Count

**Goal:** Given a paragraph on stdin, print the number of unique words (case-insensitive, strip punctuation).
 **Tests:** regex, normalization, Sets.

```js
// unique-words.js
'use strict';
const fs = require('fs');

const text = fs.readFileSync(0, 'utf8');
// TODO: toLowerCase, replace non-letters with space, split, filter empties
// TODO: use Set to count unique
console.log(/* count */);
```

**Edge cases:** apostrophes (“don’t”), hyphens (“state-of-the-art”).

------

## 4) Dedup & Sort Numbers

**Goal:** Read space-separated integers; print them sorted ascending with duplicates removed.
 **Tests:** Sets, sorting numeric vs lexicographic.

```js
// dedup-sort.js
'use strict';
const fs = require('fs');

const nums = fs.readFileSync(0, 'utf8').trim().split(/\s+/).map(Number);
// TODO: remove NaN, dedup, sort numerically
console.log(/* array joined by space */);
```

**Edge cases:** `NaN` inputs, negatives, large values.

------

## 5) Safe JSON Parse

**Goal:** Implement `safeJsonParse(str)` that returns `{ ok:true, value }` or `{ ok:false, error }` without throwing.
 **Tests:** try/catch hygiene, small API design.

```js
// safe-json-parse.js
'use strict';

function safeJsonParse(str) {
  // TODO
}

module.exports = { safeJsonParse };
```

**Edge cases:** empty string, `null`, deeply nested, reviver? (skip for beginner).

------

## 6) Read File & Count Lines (fs.promises)

**Goal:** CLI: `node count-lines.js <path>` → prints the number of newline-separated lines.
 **Tests:** `fs.promises`, CLI args, error handling.

```js
// count-lines.js
'use strict';
const fs = require('fs/promises');

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node count-lines.js <file>');
    process.exit(1);
  }
  // TODO: read file, split on \n, handle trailing newline
  console.log(/* count */);
}
main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
```

**Edge cases:** empty file, Windows `\r\n`, very large file (don’t load if you go stream-y—optional).

------

## 7) Copy a File with Streams

**Goal:** CLI: `node cp.js <src> <dest>` using readable/writable streams and `pipe`.
 **Tests:** Node streams, error events, piping.

```js
// cp.js
'use strict';
const fs = require('fs');

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Usage: node cp.js <src> <dest>');
  process.exit(1);
}

// TODO: createReadStream(src).pipe(createWriteStream(dest))
// TODO: handle 'error' on both and 'finish' on writable
```

**Edge cases:** missing source, permission denied, overwrite behavior.

------

## 8) Uppercase Transform Stream

**Goal:** Create a Transform stream that uppercases all input. Pipe stdin → transform → stdout.
 **Tests:** `stream.Transform`, backpressure.

```js
// upper-stdin.js
'use strict';
const { Transform } = require('stream');

const upper = new Transform({
  transform(chunk, enc, cb) {
    // TODO: push chunk.toString().toUpperCase()
    cb();
  }
});

process.stdin.pipe(upper).pipe(process.stdout);
```

**Edge cases:** multi-byte characters; keep it simple (ASCII).

------

## 9) Minimal HTTP JSON Server (no frameworks)

**Goal:** Start a server on `PORT` (env or 3000).

- `GET /health` → `200 {"status":"ok"}`
- `POST /echo` → echo JSON body back.
   **Tests:** core `http`, routing, parsing request body.

```js
// server-basic.js
'use strict';
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  // TODO: route on method + url
  // TODO: for POST /echo read body (collect chunks), set content-type, return JSON
  // TODO: default 404
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

**Edge cases:** invalid JSON, missing content-type, large body (you can cap it).

------

## 10) Fetch URL and Count Bytes (https.get)

**Goal:** CLI: `node count-url.js <url>` → prints number of bytes downloaded.
 **Tests:** `https` module, handling redirects minimally (optional), events.

```js
// count-url.js
'use strict';
const https = require('https');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node count-url.js <url>');
  process.exit(1);
}

// TODO: https.get(url, res => { accumulate Buffer lengths; on 'end' print count })
// TODO: handle non-200 status codes
```

**Edge cases:** HTTP vs HTTPS (use `require('http')` if needed), redirects (3xx), network errors.

------

## 11) Promisify a Callback API (manual)

**Goal:** Write `readFileP(path, encoding)` that wraps `fs.readFile` and returns a Promise.
 **Tests:** callbacks vs Promises, error-first conventions.

```js
// promisify-readfile.js
'use strict';
const fs = require('fs');

function readFileP(path, encoding = 'utf8') {
  // TODO: return new Promise((resolve, reject) => fs.readFile(...))
}

// Example usage:
// readFileP(__filename).then(console.log).catch(console.error);
```

**Edge cases:** missing file, binary mode (no encoding).

------

## 12) Sleep (delay) with async/await

**Goal:** Implement `sleep(ms)` and use it to print “tick 1..5” once per 200ms.
 **Tests:** Promise timing, `async`/`await`.

```js
// sleep-demo.js
'use strict';

const sleep = (ms) => {
  // TODO: return new Promise(resolve => setTimeout(resolve, ms));
};

(async () => {
  // TODO: loop 1..5 awaiting sleep(200) each time
})();
```

**Edge cases:** zero/negative ms (treat as immediate).

------

## 13) Config From Environment With Defaults

**Goal:** Build `getConfig()` that returns `{ port, nodeEnv, debug }` using `process.env` with sane defaults and type coercion.
 **Tests:** env parsing, validation.

```js
// config.js
'use strict';

function getConfig(env = process.env) {
  // TODO:
  // - port: integer (default 3000, valid 1..65535)
  // - nodeEnv: 'development'|'test'|'production' (default 'development')
  // - debug: boolean from 'true'/'1'/'yes' etc (default false)
  return {};
}

module.exports = { getConfig };
```

**Edge cases:** invalid port, unexpected values → throw or sanitize (state your choice).

------

## 14) Simple Logger Middleware (tiny HTTP)

**Goal:** Wrap your server handler so each request logs: method, url, response time ms.
 **Tests:** higher-order functions, timing, events.

```js
// logger-mw.js
'use strict';
const http = require('http');

function withLogging(handler) {
  return (req, res) => {
    const start = Date.now();
    res.on('finish', () => {
      const dur = Date.now() - start;
      console.error(`${req.method} ${req.url} ${res.statusCode} ${dur}ms`);
    });
    handler(req, res);
  };
}

// TODO: pass withLogging(yourHandler) to http.createServer
```

**Edge cases:** errors before headers; ensure `finish` still fires.

------

## 15) Graceful Shutdown

**Goal:** Add SIGINT/SIGTERM handlers to close the HTTP server and exit cleanly.
 **Tests:** process signals, server.close.

```js
// graceful.js
'use strict';
const http = require('http');
const server = http.createServer((req, res) => res.end('ok'));

server.listen(3000, () => console.log('up'));

function shutdown(signal) {
  console.error(`Received ${signal}. Shutting down...`);
  // TODO: server.close(cb) then process.exit(0) (or set a timeout fallback)
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

**Edge cases:** open connections hanging; add a hard timeout.

------

## 16) Tiny CLI Args Parser

**Goal:** Parse `--name=Alice --age 30 -v` into an object `{ name:'Alice', age:30, v:true }`.
 **Tests:** `process.argv`, string parsing.

```js
// parse-args.js
'use strict';

function parseArgs(argv = process.argv.slice(2)) {
  // TODO
}

// console.log(parseArgs());
```

**Edge cases:** flags without value, repeated flags, short bundles like `-abc` (optional).

------

## 17) Cache Wrapper

**Goal:** Implement `memoizeAsync(fn, ttlMs)` that caches Promise results by argument stringification for `ttlMs`.
 **Tests:** closures, maps, timing, handling concurrent calls.

```js
// memoize-async.js
'use strict';

function memoizeAsync(fn, ttlMs = 1000) {
  // TODO: Map key-> { expires, promise }
}

module.exports = { memoizeAsync };
```

**Edge cases:** rejection caching, varying args order, TTL expiry.

------

## 18) Simple EventEmitter Usage

**Goal:** Create an `Emitter` instance, register two listeners for `"data"`, emit values 1..3, then remove one listener and emit again.
 **Tests:** `events` module, listener management.

```js
// emitter-demo.js
'use strict';
const EventEmitter = require('events');

const bus = new EventEmitter();
// TODO: add listeners, emit, remove, emit
```

**Edge cases:** order of listeners, once vs on.

------

Pick two or three and code them like you would on a whiteboard—but runnable. When you’re ready, we’ll step up to intermediate (streams with backpressure limits, small Express handler pitfalls, concurrency controls, Mongo/Redis touches). If any of these feel wobbly, ask for a hint on that specific one and I’ll steer you without giving away the ending.



# Intermediate



Bring on Level 2. These are meaty but fair—perfect to build real-world Node instincts: streams, errors, backpressure, concurrency, HTTP servers/clients, and a sprinkle of operational discipline. No solutions below; when you want hints, I’ll nudge.

# Intermediate Node.js Practice Set

------

## 1) Backpressure-Aware File Copier (manual flow control)

**Goal:** Copy a large file safely without `pipe`, respecting `write()` backpressure.
 **Tests:** `fs.createReadStream`, `fs.createWriteStream`, `drain` event, error handling.

```js
// cp-backpressure.js
'use strict';
const fs = require('fs');

const [src, dest] = process.argv.slice(2);
// TODO: validate args

const rs = fs.createReadStream(src, { highWaterMark: 64 * 1024 });
const ws = fs.createWriteStream(dest);

rs.on('error', onErr);
ws.on('error', onErr);
ws.on('close', () => console.log('done'));

function onErr(err) {
  console.error('Error:', err.message);
  process.exit(1);
}

// TODO: on 'data' -> ws.write(chunk) 
// if write returns false, pause rs until 'drain'
```

**Edge cases:** tiny files, huge files, permission denied, EEXIST overwrite policy.

------

## 2) Stream Pipeline with Gzip

**Goal:** CLI: `node gz-linecount.js <path.gz>` → prints count of `\n`-separated lines inside a gzip file.
 **Tests:** `zlib.createGunzip`, `stream.pipeline`, chunk-boundary issues.

```js
// gz-linecount.js
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');

const file = process.argv[2];
// TODO: validate

let count = 0;
// TODO: transform that counts '\n' across chunk boundaries
// pipeline(fs.createReadStream(file), zlib.createGunzip(), yourTransform, cb)
```

**Edge cases:** last line without trailing `\n`, corrupted gzip.

------

## 3) Read Huge CSV by Line and Sum a Column

**Goal:** Given `node sum-col.js <file.csv> <colIndex>` compute the sum of that column without loading the whole file.
 **Tests:** `readline` over streams, numeric coercion, BOM.

```js
// sum-col.js
'use strict';
const fs = require('fs');
const readline = require('readline');

const [path, colStr] = process.argv.slice(2);
// TODO: validate
// TODO: createInterface({ input: fs.createReadStream(path) })
// accumulate Number(cells[col])
```

**Edge cases:** quoted CSV (you can document non-support), header row toggle.

------

## 4) Concurrency Limiter (p-limit clone)

**Goal:** Implement `limit = pLimit(n)` returning a function that schedules async tasks with max `n` concurrency.
 **Tests:** queues, Promise control.

```js
// p-limit-lite.js
'use strict';

function pLimit(concurrency = 5) {
  // TODO: manage running count + queue of resolvers
}

module.exports = { pLimit };
```

**Edge cases:** tasks that reject, tasks that sync-throw, `concurrency=1`.

------

## 5) Retry with Exponential Backoff + Jitter

**Goal:** `await retry(fn, {retries:5, factor:2, min:100, max:2000, jitter:true})`.
 **Tests:** timing, errors vs abort.

```js
// retry.js
'use strict';

async function retry(fn, opts = {}) {
  // TODO: implement backoff and optional full jitter
}

module.exports = { retry };
```

**Edge cases:** non-retryable errors (predicate), AbortSignal support (bonus).

------

## 6) Promise Timeout with AbortController (Node ≥18)

**Goal:** Wrap `fetch(url)` with a timeout that aborts after `ms`.
 **Tests:** `AbortController`, race between completion and timeout.

```js
// fetch-timeout.js
'use strict';

async function fetchWithTimeout(url, ms = 2000) {
  // TODO: AbortController + setTimeout
}

module.exports = { fetchWithTimeout };
```

**Edge cases:** cleanup timer, propagate cause, non-2xx handling.

------

## 7) Express Async Error Handling Wrapper

**Goal:** Write `asyncHandler(fn)` so thrown/rejected errors hit Express error middleware.
 **Tests:** Express middleware shape, error propagation.

```js
// async-handler.js
'use strict';
const express = require('express');
const app = express();

const asyncHandler = (fn) => (req, res, next) => {
  // TODO: Promise.resolve(fn(req,res,next)).catch(next)
};

app.get('/data', asyncHandler(async (req, res) => {
  // TODO: simulate async throw
  res.json({ ok: true });
}));

// error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(3000);
```

**Edge cases:** double responses, headers already sent.

------

## 8) In-Memory Rate Limiter (Token Bucket)

**Goal:** Express middleware limiting requests per `ip` to `X` tokens per minute with refill.
 **Tests:** time math, per-key state.

```js
// rate-limit.js
'use strict';

function tokenBucket({ capacity = 60, refillPerSec = 1 }) {
  // TODO: Map<key, { tokens, last }>
  return (req, res, next) => {
    const key = req.ip;
    // TODO: refill, consume 1, 429 if empty
  };
}

module.exports = { tokenBucket };
```

**Edge cases:** clock skew, burst handling, X-RateLimit headers (bonus).

------

## 9) JWT Auth Middleware (HS256)

**Goal:** Check `Authorization: Bearer <token>`; on success `req.user = payload`.
 **Tests:** `jsonwebtoken` or `node:crypto` (manual bonus), error branches.

```js
// jwt-auth.js
'use strict';
const express = require('express');
const jwt = require('jsonwebtoken'); // or roll your own
const app = express();
const SECRET = process.env.JWT_SECRET || 'dev-secret';

// TODO: middleware parse and verify token
// attach req.user or 401

app.get('/me', /* auth */, (req, res) => res.json(req.user));
```

**Edge cases:** expired tokens, missing header, wrong scheme.

------

## 10) Simple LRU Cache

**Goal:** Implement a fixed-capacity LRU: `get`, `set`, `has`, O(1) ops.
 **Tests:** Map + linked list or Map+order hacks.

```js
// lru.js
'use strict';

class LRU {
  constructor(max = 100) { /* TODO */ }
  get(key) { /* TODO */ }
  set(key, value) { /* TODO */ }
  has(key) { /* TODO */ }
}

module.exports = { LRU };
```

**Edge cases:** overwrites, delete oldest, zero/one capacity.

------

## 11) Graceful HTTP Shutdown with In-Flight Tracking

**Goal:** Track active requests; on SIGTERM stop accepting, wait up to 5s, then `server.close()`.
 **Tests:** `request`/`finish` events, timeouts.

```js
// graceful-inflight.js
'use strict';
const http = require('http');

let inFlight = 0;
const server = http.createServer((req, res) => {
  inFlight++;
  res.on('finish', () => inFlight--);
  setTimeout(() => res.end('ok'), 100); // pretend work
});

server.listen(3000);

process.on('SIGTERM', () => {
  console.error('SIGTERM received: draining...');
  server.close(() => console.error('Closed server'));
  const deadline = Date.now() + 5000;
  const checker = setInterval(() => {
    if (inFlight === 0 || Date.now() > deadline) {
      clearInterval(checker);
      process.exit(0);
    }
  }, 100);
});
```

**Edge cases:** long-poll requests, open sockets—consider `server.getConnections`.

------

## 12) Exec a Command and Return JSON Result

**Goal:** CLI: `node exec-json.js "git status --porcelain"` → JSON with `exitCode`, `stdout`, `stderr`.
 **Tests:** `child_process.exec`, buffer limits, non-zero exit.

```js
// exec-json.js
'use strict';
const { exec } = require('child_process');

const cmd = process.argv.slice(2).join(' ');
// TODO: exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, cb)
```

**Edge cases:** huge output, shell injection (document trust model).

------

## 13) Worker Threads for CPU-Bound Tasks + Queue

**Goal:** Offload Fibonacci(40) computations to a worker pool of size `N`.
 **Tests:** `worker_threads`, message passing, queueing.

```js
// pool.js
'use strict';
const { Worker } = require('worker_threads');

// TODO: create N workers, round-robin or idle-queue dispatch
// expose run(taskData) -> Promise

// worker.js
'use strict';
const { parentPort } = require('worker_threads');
// TODO: compute fib(n) synchronously; postMessage(result)
```

**Edge cases:** worker crash, backpressure on task submission.

------

## 14) File Watcher with Debounce Rebuild

**Goal:** Watch a directory; on any change, debounce 200ms then run a build command once.
 **Tests:** `fs.watch` vs `fs.watchFile`, debouncing.

```js
// watch-build.js
'use strict';
const fs = require('fs');
const { exec } = require('child_process');

const dir = process.argv[2] || '.';
let timer;

// TODO: fs.watch(dir, { recursive: true }, (event, filename) => { debounce; exec('node build.js') })
```

**Edge cases:** duplicate events, missing recursive on Linux, process reuse.

------

## 15) NDJSON Validator Transform

**Goal:** Transform stream that reads newline-delimited JSON; valid objects pass through, invalid lines emit an error and are skipped (or tagged).
 **Tests:** Transform in `objectMode`, error strategy.

```js
// ndjson-validate.js
'use strict';
const { Transform } = require('stream');

class NDJSONValidate extends Transform {
  constructor() { super({ readableObjectMode: true, writableObjectMode: false }); }
  _transform(chunk, enc, cb) {
    // TODO: handle partial lines (keep a buffer between chunks)
  }
}

module.exports = { NDJSONValidate };
```

**Edge cases:** multi-chunk lines, trailing newline, large lines.

------

## 16) Minimal HTTP Reverse Proxy (no deps)

**Goal:** Proxy all `/api/*` requests to `TARGET` while preserving method/headers, streaming body, and piping back response.
 **Tests:** `http.request`, header filtering, streaming.

```js
// proxy.js
'use strict';
const http = require('http');
const { URL } = require('url');

const TARGET = new URL(process.env.TARGET || 'http://localhost:4000');

const server = http.createServer((req, res) => {
  // TODO: only proxy /api/, else 404
  // construct options from req and TARGET
  // pipe req -> proxyReq; proxyRes -> res
});

server.listen(3000);
```

**Edge cases:** hop-by-hop headers, timeouts, error retry (bonus).

------

## 17) Async Context Correlation with AsyncLocalStorage

**Goal:** Assign a request-id per incoming HTTP request and make it accessible deep in async stacks for logging.
 **Tests:** `async_hooks.AsyncLocalStorage`.

```js
// request-id.js
'use strict';
const http = require('http');
const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const als = new AsyncLocalStorage();

const server = http.createServer((req, res) => {
  const id = crypto.randomUUID();
  als.run({ id }, () => {
    // simulate async work and log with id from als.getStore()
    res.end('ok');
  });
});

server.listen(3000);
```

**Edge cases:** nested runs, missing store lookups.

------

## 18) Batch Transform (objectMode)

**Goal:** Create a Transform that batches incoming objects into arrays of max `size` or `ms` timeout, whichever comes first.
 **Tests:** timers in streams, flushing on end.

```js
// batch-transform.js
'use strict';
const { Transform } = require('stream');

function batch({ size = 10, ms = 200 }) {
  // TODO: buffer [], push when full or timer fires; clear timer on flush/end
  return new Transform({ objectMode: true, /* ... */ });
}

module.exports = { batch };
```

**Edge cases:** partial final batch, timer leaks, backpressure when pushing big batches.

------

## 19) HTTP Client with Connection Reuse and Retries

**Goal:** GET a list of URLs with a shared `Agent` (keep-alive), limit concurrency to `k`, retry transient failures (5xx) up to 2 times.
 **Tests:** `http.Agent`, pooling, custom retry.

```js
// http-pool-get.js
'use strict';
const http = require('http');
// TODO: new http.Agent({ keepAlive: true })
// TODO: limit concurrency + basic retry loop
```

**Edge cases:** mix of http/https (separate agents), timeouts.

------

## 20) Minimal Config Loader (env + .env)

**Goal:** Load `.env` file (key=value), merge with `process.env`, coerce types, validate required keys.
 **Tests:** `fs.readFile`, parsing, schema-lite.

```js
// config-load.js
'use strict';
const fs = require('fs');

function loadEnv(path = '.env') {
  // TODO: parse; ignore comments/#; trim; handle quoted values
  return {};
}

function getConfig(env = process.env) {
  // TODO: pick PORT (int), DEBUG (bool), BASE_URL (url-ish), throw on invalid
}

module.exports = { loadEnv, getConfig };
```

**Edge cases:** duplicates, empty lines, escaping.

------

When you’re ready, we can step into **advanced**: zero-downtime deploys, clustering vs worker_threads, perf profiling (CPU/heap), memory leak hunts, streaming parsers with backpressure tests, and Mongo/Redis integrations. Pick any item above you want hints for, and I’ll drop breadcrumbs without giving away the treasure.

# Advanced

Cranking the difficulty knob to spicy. These advanced Node.js drills simulate “real prod” problems: zero-downtime restarts, load-shedding, circuit breaking, streaming parsers, worker pools, HTTP/2, TLS, WebSocket upgrades, diagnostics, and performance. No solutions—just crisp prompts, scaffolds, and gotchas to flex serious Node instincts.

# Advanced Node.js Practice Set

------

## 1) Zero-Downtime Rolling Restart (cluster + graceful drain)

**Goal:** Master → forks `N` workers. Implement `SIGHUP` to roll workers one-by-one: stop accepting, drain in-flight, replace with a fresh worker before moving on.
 **Tests:** `cluster`, `server.close`, `process.on('message')`, drain logic.

```js
// cluster-rolling.js
'use strict';
const cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isPrimary) {
  const n = Number(process.env.WORKERS) || os.cpus().length;
  for (let i = 0; i < n; i++) cluster.fork();

  process.on('SIGHUP', async () => {
    const ids = Object.values(cluster.workers).map(w => w.id);
    for (const id of ids) {
      const w = cluster.workers[id];
      // TODO: send 'shutdown' to worker, wait for 'ready' from replacement
    }
  });
} else {
  let inFlight = 0, accepting = true;
  const server = http.createServer((req, res) => {
    if (!accepting) { res.statusCode = 503; return res.end('draining'); }
    inFlight++; res.on('finish', () => inFlight--);
    setTimeout(() => res.end(`pid ${process.pid}`), 100); // fake work
  });
  server.listen(process.env.PORT || 3000);

  process.on('message', async (msg) => {
    if (msg === 'shutdown') {
      accepting = false;
      server.close(() => { if (inFlight === 0) process.exit(0); });
      // TODO: set hard timeout to exit after X ms
    }
  });
}
```

**Edge cases:** worker crash during roll; ensure at least one worker stays up; hard timeout for zombie requests.

------

## 2) Circuit Breaker with Half-Open Probe

**Goal:** Implement `breaker(fn, {failureThreshold, cooldownMs, halfOpenMax})`. Open on consecutive failures; after cooldown, allow a limited half-open probe; close on success.
 **Tests:** error categorization, timestamps, state machine.

```js
// circuit-breaker.js
'use strict';

function circuitBreaker(fn, opts = {}) {
  // TODO: states: 'closed' | 'open' | 'half'
  // track failures, openedAt, halfOpen count
  return async (...args) => {
    // TODO: enforce state, maybe throw BreakerOpenError
  };
}

module.exports = { circuitBreaker };
```

**Edge cases:** time skew, distinguishing retryable vs non-retryable.

------

## 3) Load Shedding via Event Loop Lag

**Goal:** Reject requests when event loop is slogging. If `lag > X ms` over a sliding window, respond 503.
 **Tests:** `perf_hooks.monitorEventLoopDelay`, moving average.

```js
// shed-lag.js
'use strict';
const http = require('http');
const { monitorEventLoopDelay } = require('perf_hooks');

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

http.createServer((req, res) => {
  const lag = h.mean / 1e6; // ms
  if (lag > 100) { res.statusCode = 503; return res.end('busy'); }
  // TODO: normal handler
}).listen(3000);
```

**Edge cases:** warmup, reset stats periodically, long GC pauses.

------

## 4) HTTP/2 Multiplex Echo + Trailers

**Goal:** Build an HTTP/2 server that serves `/echo` streaming body back and sends response trailers (like `grpc-status`) correctly.
 **Tests:** `http2.createSecureServer` or `createServer`, `stream.respond`, `stream.addTrailers`.

```js
// h2-echo.js
'use strict';
const http2 = require('http2');

const server = http2.createServer();
server.on('stream', (stream, headers) => {
  // TODO: route by :path, :method; pipe stream back to itself
  // TODO: set trailers with stream.addTrailers({ 'x-ok': '1' })
});
server.listen(3001);
```

**Edge cases:** client preface errors, flow control with large bodies.

------

## 5) WebSocket Upgrade Proxy (no deps)

**Goal:** Reverse proxy that forwards HTTP and `Upgrade: websocket` to a target, preserving backpressure.
 **Tests:** `http.createServer`, `'upgrade'` event, `net.connect`.

```js
// ws-proxy.js
'use strict';
const http = require('http');
const net = require('net');
const { URL } = require('url');

const TARGET = new URL(process.env.TARGET || 'http://localhost:4000');

const server = http.createServer((req, res) => {
  // TODO: normal HTTP proxy for /api/*
});

server.on('upgrade', (req, socket, head) => {
  // TODO: connect to TARGET using net, write HTTP upgrade headers, pipe both ways
});

server.listen(3000);
```

**Edge cases:** half-open sockets, error cleanup, header sanitization.

------

## 6) Streaming JSON Array Parser (O(1) memory)

**Goal:** Parse a gigantic `[`…`,`…`,`…`]` JSON array from stdin and emit each element to stdout as NDJSON without loading whole file.
 **Tests:** character scanning, brace/bracket depth, quoted strings, escapes.

```js
// json-array-to-ndjson.js
'use strict';

process.stdin.setEncoding('utf8');
let buf = '', depth = 0, inStr = false, esc = false, started = false;

process.stdin.on('data', chunk => {
  // TODO: iterate chars, track inStr/esc/depth; slice items at depth==1 commas
});
process.stdin.on('end', () => {
  // TODO: flush last item if any
});
```

**Edge cases:** whitespace, nested objects/arrays, unicode escapes.

------

## 7) Worker Pool with Transferable Buffers

**Goal:** Transform large `Uint8Array` tasks in worker threads; pass data via transfer list to avoid copies.
 **Tests:** `worker_threads`, `postMessage(value, [transferables])`.

```js
// pool-transfer.js
'use strict';
const { Worker } = require('worker_threads');

class Pool { /* TODO: size N, idle queue, run(buf)->Promise */ }
module.exports = { Pool };

// worker.js
'use strict';
const { parentPort } = require('worker_threads');
parentPort.on('message', ({ id, buf }) => {
  // TODO: mutate buf in place, post back { id, buf } transferring buffer
});
```

**Edge cases:** backpressure when callers outpace workers; worker crash recovery.

------

## 8) Sticky Sessions for WS with Cluster

**Goal:** Clustered HTTP server with WebSocket that needs sticky routing. Implement a tiny TCP balancer in master that hashes `remoteAddress` to a worker and forwards the socket (use `cluster` + `net` + `worker.send({ cmd:'sticky' }, socket)`).
 **Tests:** understanding of `server.listen({ exclusive: false })` and socket passing.

```js
// cluster-sticky.js
'use strict';
// TODO: master: net.createServer(), on connection choose worker, worker.send with socket
// TODO: worker: http + ws (or raw 'upgrade') server listens on 0; handle sockets from master
```

**Edge cases:** IPv6 vs IPv4 hashing; worker death; backpressure.

------

## 9) TLS SNI Dynamic Certificates

**Goal:** HTTPS server that serves different certs per hostname, loading from disk/cache at first request via `SNICallback`.
 **Tests:** `tls.createSecureContext`, LRU for contexts.

```js
// tls-sni.js
'use strict';
const https = require('https');
const tls = require('tls');
const fs = require('fs/promises');

const cache = new Map();
async function getCtx(hostname) {
  // TODO: cache get or read key/cert files, createSecureContext
}
https.createServer({ SNICallback: (servername, cb) => {
  getCtx(servername).then(ctx => cb(null, ctx)).catch(cb);
}}, (req, res) => res.end('ok')).listen(3443);
```

**Edge cases:** wildcard domains, cache eviction, missing cert.

------

## 10) Heap/CPU Profiling via Inspector

**Goal:** Programmatically capture a CPU profile and heap snapshot around some workload; write `.cpuprofile` and `.heapsnapshot` files.
 **Tests:** `inspector` session usage.

```js
// profile-capture.js
'use strict';
const inspector = require('inspector');
const fs = require('fs');

async function profile(work) {
  const session = new inspector.Session(); session.connect();
  // TODO: Profiler.enable, start, run work, stop, write file
  // TODO: HeapProfiler.takeHeapSnapshot
}
```

**Edge cases:** ensure `await` work; large files; proper session.disconnect.

------

## 11) Event Loop Delay Budgeter (per request)

**Goal:** Track per-request compute time budget; if overruns, yield with `setImmediate` to avoid starving the loop; return 503 if cumulative compute time exceeds threshold.
 **Tests:** cooperative multitasking pattern.

```js
// budgeter.js
'use strict';
const http = require('http');

http.createServer(async (req, res) => {
  let budgetMs = 30;
  let last = Date.now();
  for (let i = 0; i < 1e7; i++) {
    // TODO: periodically check Date.now()-last; if > 8ms, await new Promise(r=>setImmediate(r))
    // track cumulative compute; if > budgetMs -> 503
  }
  res.end('done');
}).listen(3000);
```

**Edge cases:** TSC jumps; ensure fairness under load.

------

## 12) Async Resource Tracing with async_hooks

**Goal:** Minimal tracer that assigns a request id and logs when async resources (timeouts, promises, TCP) are initialized/destroyed during that request.
 **Tests:** `async_hooks.createHook`, `AsyncLocalStorage` correlation.

```js
// trace-async.js
'use strict';
const http = require('http');
const { createHook, AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

createHook({
  init(asyncId, type, triggerAsyncId) {
    const ctx = als.getStore();
    if (ctx) console.error(`[${ctx.id}] init ${type} ${asyncId} <- ${triggerAsyncId}`);
  },
  destroy(asyncId) { /* TODO */ }
}).enable();

http.createServer((req, res) => {
  const id = Math.random().toString(36).slice(2);
  als.run({ id }, () => {
    setTimeout(() => res.end('ok'), 50);
  });
}).listen(3000);
```

**Edge cases:** noise volume; filtering types.

------

## 13) HTTP Client Pool with Deadline + Retry Budget

**Goal:** Fetch many URLs with shared keep-alive `Agent`, per-request deadline, and a global retry budget (e.g., at most 20 retries across the batch).
 **Tests:** `http.Agent`, timers, concurrency limiter + budget accounting.

```js
// http-deadline-pool.js
'use strict';
const http = require('http');

async function fetchWithDeadline(url, { ms, agent }) { /* TODO */ }
// TODO: limit concurrency K, share budget across tasks
```

**Edge cases:** mix of http/https; socket timeouts vs response timeouts.

------

## 14) Backpressure-Aware Zip Downloader

**Goal:** Download a `.zip`, stream through unzip (no deps—treat as passthrough if you prefer), and write entries to disk respecting backpressure; fail fast on any entry error while aborting the upstream request.
 **Tests:** streaming trees, abort logic.

```js
// zip-stream-dl.js
'use strict';
const https = require('https');
const fs = require('fs');
// TODO: https.get -> response; for practice, split by fake boundaries to simulate entries
// TODO: on failure, destroy response/request and clean up partial files
```

**Edge cases:** partial writes, cleanup on SIGINT.

------

## 15) Batcher as Async Iterator (time + size)

**Goal:** Build `batchAsync(sourceAsyncIter, { size, ms })` yielding arrays flushed by max size or timeout.
 **Tests:** async iterators, timers, cancellation.

```js
// batch-iter.js
'use strict';

async function* batchAsync(source, { size = 50, ms = 200 }) {
  // TODO: maintain buffer, timer; yield on size or time; flush on end
}
module.exports = { batchAsync };
```

**Edge cases:** timer leaks, racing timeout vs source end, error propagation.

------

## 16) Minimal gRPC-like Framing over TCP

**Goal:** Define a tiny binary protocol: 4-byte BE length prefix + JSON payload. Implement server and client with message framing, handling split/merged TCP packets.
 **Tests:** `net.createServer`, buffering, `Buffer.allocUnsafe`.

```js
// tcp-framed.js
'use strict';
const net = require('net');

function encode(obj) { /* TODO: Buffer with 4-byte len + JSON */ }
function createDecoder(onMsg) { /* TODO: closure with buffer state */ }

const server = net.createServer(sock => {
  const onMsg = (obj) => { /* TODO */ };
  sock.on('data', createDecoder(onMsg));
});
server.listen(4500);
```

**Edge cases:** malicious lengths, backpressure on writes.

------

## 17) Problem+JSON Error Normalizer (RFC 7807)

**Goal:** Express middleware that standardizes errors to `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`. Include correlation id from ALS.
 **Tests:** error mapping, content negotiation.

```js
// problem-json.js
'use strict';
const express = require('express');
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();
const app = express();

// TODO: request id middleware using als
// TODO: route that throws; error handler that returns problem+json

app.listen(3000);
```

**Edge cases:** headers-sent, default titles per status.

------

## 18) Pluggable Serializer Cache with WeakRef

**Goal:** Cache expensive serialized forms (e.g., HTML rendering) with `WeakRef` + `FinalizationRegistry` to avoid pinning memory; rebuild on GC.
 **Tests:** WeakRef semantics, registry cleanup.

```js
// weakref-cache.js
'use strict';

class SerializerCache {
  constructor(serializer) {
    this.map = new Map(); // key -> { ref: WeakRef(value), ser: string }
    // TODO: FinalizationRegistry to purge entries
  }
  get(key, obj) { /* TODO: if ref dead, reserialize */ }
}
```

**Edge cases:** registry callback timing; memory pressure.

------

## 19) Precise Control of Microtasks vs Macrotasks

**Goal:** Given a script, schedule logs in exact order using `queueMicrotask`, `process.nextTick`, `setImmediate`, and `setTimeout`. Write a mini harness that asserts the order across Node versions.
 **Tests:** event loop phases.

```js
// task-order.js
'use strict';

function schedule(trace) {
  // TODO: push tokens into trace array using different schedulers
}
module.exports = { schedule };
```

**Edge cases:** recursion depth of `nextTick`, starvation.

------

## 20) High-Perf Static File Server with Preopen + Range

**Goal:** Serve large files with `fs.open` reuse, `sendfile`-like piping, handle `Range` requests, and add weak ETag.
 **Tests:** `fs.createReadStream` with `start`/`end`, conditional headers.

```js
// static-range.js
'use strict';
const http = require('http');
const fs = require('fs');

http.createServer(async (req, res) => {
  // TODO: parse Range, set 206/Content-Range, stream chunk
  // TODO: ETag = size-mtime, handle If-None-Match
}).listen(8080);
```

**Edge cases:** multiple ranges (reject or simplify), invalid ranges.

------

## 21) Redis-Style RESP Parser (streams)

**Goal:** Implement a stream Transform that parses a subset of RESP (`+simple`, `:int`, `$bulk`, `*array`) to JS values.
 **Tests:** chunk boundaries, state machine.

```js
// resp-parser.js
'use strict';
const { Transform } = require('stream');
class RESPParser extends Transform {
  constructor() { super({ readableObjectMode: true }); /* TODO: state */ }
  _transform(chunk, enc, cb) { /* TODO */ }
}
module.exports = { RESPParser };
```

**Edge cases:** nested arrays, null bulk `-1`, huge payloads.

------

## 22) ESM/CJS Dual-Export Package Skeleton

**Goal:** Create a tiny library that works in both import styles: `import { x } from 'pkg'` and `const { x } = require('pkg')`. Provide `package.json` with `exports`, `type`, and two builds.
 **Tests:** module resolution, conditional exports.

```js
// pkg/src/index.mjs  (ESM)
// export const x = () => 'hi';

// pkg/src/index.cjs  (CJS)
// exports.x = () => 'hi';

// pkg/package.json  (sketch)
// {
//   "name": "pkg",
//   "type": "module",
//   "exports": {
//     "import": "./dist/index.mjs",
//     "require": "./dist/index.cjs"
//   }
// }
```

**Edge cases:** default vs named exports, TS typings.

------

## 23) Graceful Abort with AbortSignal Across Layers

**Goal:** Thread an `AbortSignal` from HTTP handler → DB call → worker task → HTTP client; ensure every layer stops work promptly.
 **Tests:** `AbortController`, signal propagation, cleanup.

```js
// abort-plumb.js
'use strict';

async function handler(req, res) {
  const ac = new AbortController();
  req.on('close', () => ac.abort('client disconnected'));
  // TODO: pass ac.signal into internal layers and respect it
}
```

**Edge cases:** double abort, mapping abort to specific error class.

------

## 24) Rolling Log Writer with Backpressure + Rotation

**Goal:** Implement a logger that writes JSON lines to a file; rotate on size/time; if disk is slow, apply in-memory buffer with drop-new policy when above threshold.
 **Tests:** stream backpressure, timers, file rotation.

```js
// log-rotate.js
'use strict';
const fs = require('fs');

class RollingLog { /* TODO: write, rotate(size/time), buffer, drop policy */ }
```

**Edge cases:** rotation race, fs errors, flush on exit.

------

## 25) Incremental YAML → JSON Converter (streaming)

**Goal:** Convert large YAML (one doc per `---`) arriving on stdin to NDJSON, streaming; skip invalid docs but continue.
 **Tests:** delimiter detection, error isolation.
 *No YAML libs—treat each doc as key: value lines (limited subset) to keep it algorithmic.*

```js
// yaml-to-ndjson.js
'use strict';
let buf = '';
process.stdin.setEncoding('utf8');
// TODO: split by /^---$/ on chunk boundaries; parse simple key: value lines; emit JSON per doc
```

**Edge cases:** multiline values (document and skip), trailing doc without newline.

------

Pick any item and say “hint for #X” when you’re ready—I’ll give you breadcrumbs without spoiling it. If you want, I can also turn any one of these into a timed, test-harness style kata to simulate a coding screen.