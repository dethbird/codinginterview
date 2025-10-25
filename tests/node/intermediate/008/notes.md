Awesome—here’s a crisp “gold answer” you can drop into notes, plus a quick explainer and tiny tests.

# 8) In-Memory Rate Limiter (Token Bucket)

### What it does

Per **IP**, allow bursts up to `capacity` and then refill at `refillPerSec` tokens/second. Each request **consumes 1 token**. If empty → **429 Too Many Requests**.
Adds helpful rate-limit headers and a `Retry-After` when blocked.

---

### Drop-in code (`rate-limit.js`)

```js
// rate-limit.js
'use strict';

/**
 * Token Bucket rate limiter (per-key, e.g., per IP).
 *
 * @param {Object} opts
 * @param {number} [opts.capacity=60]          Max burst size (tokens)
 * @param {number} [opts.refillPerSec=1]       Refill rate (tokens per second)
 * @param {(req: any) => string} [opts.keyer]  How to key buckets (default: req.ip)
 * @param {boolean} [opts.headers=true]        Emit X-RateLimit* headers
 */
function tokenBucket({ capacity = 60, refillPerSec = 1, keyer = (req) => req.ip, headers = true } = {}) {
  if (capacity <= 0 || refillPerSec <= 0) throw new Error('capacity and refillPerSec must be > 0');

  // Map<key, { tokens: number, last: number(ms since epoch) }>
  const buckets = new Map();

  return (req, res, next) => {
    const key = keyer(req) ?? 'global';
    const now = Date.now();

    let b = buckets.get(key);
    if (!b) {
      b = { tokens: capacity, last: now };
      buckets.set(key, b);
    }

    // Refill since last request (guard against clock skew)
    const elapsedSec = Math.max(0, (now - b.last) / 1000);
    if (elapsedSec > 0) {
      b.tokens = Math.min(capacity, b.tokens + elapsedSec * refillPerSec);
      b.last = now;
    }

    // Helper to set headers (bonus)
    const setHeaders = (remaining) => {
      if (!headers) return;
      // Remaining rounded down for user clarity
      res.setHeader('X-RateLimit-Limit', String(capacity));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, Math.floor(remaining))));
      // Optional: when bucket is expected to be full again (epoch seconds)
      const secondsToFull = (capacity - b.tokens) / refillPerSec;
      const resetEpochSec = Math.ceil(now / 1000 + Math.max(0, secondsToFull));
      res.setHeader('X-RateLimit-Reset', String(resetEpochSec));
    };

    if (b.tokens >= 1) {
      // Consume one token and allow
      b.tokens -= 1;
      setHeaders(b.tokens);
      return next();
    }

    // Out of tokens → compute wait time until 1 token is available
    const waitSec = Math.ceil((1 - b.tokens) / refillPerSec); // full jitter not needed here
    setHeaders(0);
    res.setHeader('Retry-After', String(waitSec));
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: waitSec,
    });
  };
}

module.exports = { tokenBucket };
```

---

### Usage (Express)

```js
const express = require('express');
const { tokenBucket } = require('./rate-limit');

const app = express();

// If you're behind a proxy/load balancer and want real client IPs:
app.set('trust proxy', true);

app.use(tokenBucket({ capacity: 60, refillPerSec: 1 })); // 60 req/min per IP

app.get('/ok', (req, res) => res.json({ ok: true }));
app.listen(3000, () => console.log('http://localhost:3000'));
```

---

### Why this passes tests

* **Per-key state:** Map keyed by `req.ip` (customizable via `keyer`).
* **Time math:** Refill = `elapsedSec * refillPerSec`, clamped to `capacity`.
* **Burst handling:** Start full; can instantly spend up to `capacity`.
* **Correct 429 behavior:** When empty, computes `Retry-After` until 1 token refills.
* **Headers (bonus):**

  * `X-RateLimit-Limit`: capacity
  * `X-RateLimit-Remaining`: floor of remaining
  * `X-RateLimit-Reset`: epoch seconds when bucket is full again

---

### Tiny tests (with supertest)

```js
const request = require('supertest');
const express = require('express');
const { tokenBucket } = require('./rate-limit');

const app = express();
app.use(tokenBucket({ capacity: 2, refillPerSec: 1, headers: true }));
app.get('/', (req, res) => res.send('ok'));

(async () => {
  // First two should pass
  await request(app).get('/').expect(200);
  await request(app).get('/').expect(200);

  // Third immediately hits 429
  const r = await request(app).get('/').expect(429);
  console.log('retry-after:', r.headers['retry-after']); // ~1

  // Wait ~1s then should pass again
  await new Promise(r => setTimeout(r, 1100));
  await request(app).get('/').expect(200);
})();
```

---

### Notes / Edge cases

* **Clock skew:** `Math.max(0, elapsed)` prevents negative refill.
* **Memory growth:** For high-cardinality IPs, consider pruning entries idle for N minutes (a simple periodic sweep).
* **Proxies:** Set `app.set('trust proxy', true)` if you want `req.ip` to reflect `X-Forwarded-For`.
* **Granularity:** Token bucket uses fractional tokens internally; remaining header floors for readability.
