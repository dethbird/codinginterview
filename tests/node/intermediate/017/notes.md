Awesome—this is a perfect use-case for `AsyncLocalStorage`. Here’s a compact, production-ready pattern you can drop into your notes.

# 17) Async Context Correlation with `AsyncLocalStorage`

### What it does

* Assigns a **request ID** per incoming HTTP request.
* Makes that ID available **anywhere downstream** (even deep in async stacks) for logging.
* Safe with **nested `run`** calls (inner IDs override; outer restored after exit).
* Gracefully handles **missing store** (falls back to `'unknown'`).

---

### 💎 Drop-in code (`request-id.js`)

```js
// request-id.js
'use strict';
const http = require('http');
const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const als = new AsyncLocalStorage();

// Helper: read the current request id (or fallback)
function getRequestId() {
  return als.getStore()?.id ?? 'unknown';
}

// Helper: log with request id prefix
function log(...args) {
  console.log(`[req:${getRequestId()}]`, ...args);
}

const server = http.createServer((req, res) => {
  // Generate a request id; prefer existing if client sent one
  const incoming = req.headers['x-request-id'];
  const id = (typeof incoming === 'string' && incoming.trim()) || crypto.randomUUID();

  // Start an ALS context for this request
  als.run({ id }, async () => {
    const started = Date.now();
    log('incoming', req.method, req.url);

    // simulate async work that hops across promise/timer boundaries
    await new Promise((r) => setTimeout(r, 50));
    await doNestedThing();

    res.setHeader('x-request-id', id);
    res.end('ok');

    log('completed in', Date.now() - started, 'ms');
  });
});

// Example deep async function that can access the request id
async function doNestedThing() {
  log('nested start');
  await Promise.resolve(); // tick hop
  await new Promise((r) => setTimeout(r, 10));
  log('nested end');
}

server.listen(3000, () => {
  console.log('listening on http://localhost:3000');
});
```

---

### 🧪 Quick sanity test

```bash
node request-id.js &
curl -i http://localhost:3000/
# → response has x-request-id header
# terminal shows logs prefixed with [req:<uuid>] across async calls

curl -i -H "x-request-id: abc123" http://localhost:3000/
# → logs use [req:abc123]
```

---

### Why this passes tests

* Uses `als.run({ id }, () => …)` to **establish context** for each request.
* `als.getStore()` works across **async boundaries** (Promises, timers, I/O).
* Nested `als.run` (if any) **overrides** the store during the inner scope and **restores** afterward—no leakage.
* Missing store lookups (e.g., code executed outside a request) return `'unknown'`, avoiding crashes.

---

### Notes & options

* **Header propagation:** It’s common to accept an inbound `X-Request-Id` and return it so clients can correlate logs.
* **Express/Koa integration:** Wrap your top-level handler/middleware with `als.run`. In Express:

  ```js
  app.use((req, res, next) => {
    const id = req.get('x-request-id') || crypto.randomUUID();
    als.run({ id }, () => next());
  });
  ```
* **Logger integration:** Replace `console.log` with your logger (pino/winston) and inject the id in a child logger per request.
* **Avoid global mutation:** read the id via `als.getStore()` where needed; don’t stash it in module globals.

---

### Tiny edge-case demo: nested `run`

```js
als.run({ id: 'outer' }, () => {
  log('A'); // [req:outer]
  als.run({ id: 'inner' }, () => {
    log('B'); // [req:inner]
  });
  log('C');   // [req:outer] (restored)
});
```

That’s it—simple, reliable request correlation with first-class async context support.
