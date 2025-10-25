Absolutely—here’s a compact, production-minded “gold answer” you can drop into your notes. It:

* reuses connections via keep-alive **http(s).Agent** (one per protocol),
* limits concurrency with a tiny **semaphore**,
* retries **transient failures (5xx)** up to **2** times,
* supports **timeouts**, and
* works with a mixed list of `http:` and `https:` URLs.

---

# 19) HTTP Client with Connection Reuse and Retries

```js
// http-pool-get.js
'use strict';
const http = require('http');
const https = require('https');
const { URL } = require('url');

// ---- Shared keep-alive agents (pooling) ----
const HTTP_AGENT = new http.Agent({
  keepAlive: true,
  maxSockets: 50,       // tune per needs
  maxFreeSockets: 10,
  timeout: 0,           // socket idle timeout (ms) 0 = node default
});
const HTTPS_AGENT = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 0,
});

// ---- Tiny semaphore for concurrency limiting ----
function createSemaphore(limit) {
  let active = 0;
  const q = [];
  const take = () =>
    new Promise((r) => {
      if (active < limit) {
        active++; r();
      } else {
        q.push(r);
      }
    });
  const release = () => {
    active--;
    const next = q.shift();
    if (next) { active++; next(); }
  };
  return { take, release, get active() { return active; }, get pending() { return q.length; } };
}

// ---- Low-level GET with timeout, using agents ----
function httpGet(urlStr, { timeout = 10_000 } = {}) {
  const u = new URL(urlStr);
  const isHttps = u.protocol === 'https:';
  const mod = isHttps ? https : http;
  const agent = isHttps ? HTTPS_AGENT : HTTP_AGENT;

  const options = {
    protocol: u.protocol,
    hostname: u.hostname,
    port: u.port || (isHttps ? 443 : 80),
    path: `${u.pathname}${u.search}`,
    method: 'GET',
    agent,
    // You can add headers here if needed
  };

  return new Promise((resolve, reject) => {
    const req = mod.request(options, (res) => {
      // Collect body (simple version; for very large bodies prefer streaming)
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({ statusCode: res.statusCode || 0, headers: res.headers, body });
      });
    });

    req.on('error', reject);

    req.setTimeout(timeout, () => {
      req.destroy(new Error(`Timeout after ${timeout}ms`));
    });

    req.end();
  });
}

// ---- Retry wrapper for 5xx (and optional transient network errors) ----
async function getWithRetry(urlStr, { retries = 2, timeout = 10_000 } = {}) {
  let attempt = 0;
  // Simple exponential backoff (100ms, 200ms, 400ms)
  const backoff = (n) => new Promise((r) => setTimeout(r, 100 * Math.pow(2, n)));

  // Retry predicate: 5xx or selected transient network errors
  const shouldRetry = (resOrErr) => {
    if (resOrErr && typeof resOrErr === 'object' && 'statusCode' in resOrErr) {
      const sc = resOrErr.statusCode || 0;
      return sc >= 500 && sc < 600;
    }
    // Network-ish errors (optional)
    const code = resOrErr && resOrErr.code;
    return ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH'].includes(code);
  };

  while (true) {
    try {
      const res = await httpGet(urlStr, { timeout });
      if (res.statusCode >= 500 && shouldRetry(res) && attempt < retries) {
        await backoff(attempt++);
        continue;
      }
      return res; // success or non-retryable status
    } catch (err) {
      if (attempt < retries && shouldRetry(err)) {
        await backoff(attempt++);
        continue;
      }
      throw err;
    }
  }
}

// ---- Public helper: fetch a list with concurrency k ----
async function getAll(urls, { concurrency = 5, timeout = 10_000, retries = 2 } = {}) {
  const sem = createSemaphore(concurrency);
  const results = new Array(urls.length);

  await Promise.all(
    urls.map((u, i) =>
      (async () => {
        await sem.take();
        try {
          const { statusCode, headers, body } = await getWithRetry(u, { retries, timeout });
          results[i] = { url: u, ok: statusCode >= 200 && statusCode < 300, statusCode, headers, body };
        } catch (err) {
          results[i] = { url: u, ok: false, error: err.message || String(err) };
        } finally {
          sem.release();
        }
      })()
    )
  );

  return results;
}

// ---- If run as a CLI: node http-pool-get.js <k> <url1> <url2> ...
if (require.main === module) {
  (async () => {
    const [, , kArg, ...rest] = process.argv;
    const k = Number.isInteger(Number(kArg)) ? Number(kArg) : 5;
    const urls = Number.isInteger(Number(kArg)) ? rest : [kArg, ...rest].filter(Boolean);
    if (!urls.length) {
      console.error('Usage: node http-pool-get.js <concurrency> <url1> <url2> ...');
      process.exit(2);
    }
    try {
      const out = await getAll(urls, { concurrency: k });
      // Print compact JSON (body as utf8 when safe, else base64)
      const json = out.map((r) => {
        if (r.ok && r.body) {
          const isText = /^text\/|\/json$|\/javascript$/.test(r.headers?.['content-type'] || '');
          r.body = isText ? r.body.toString('utf8') : r.body.toString('base64');
          r.bodyEncoding = isText ? 'utf8' : 'base64';
        }
        return r;
      });
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('Fatal:', e);
      process.exit(1);
    }
  })();
}

module.exports = { getAll, getWithRetry, httpGet, HTTP_AGENT, HTTPS_AGENT };
```

---

## Why this passes the tests

* **Pooling / reuse:** `new http.Agent({ keepAlive: true })` & `new https.Agent({ keepAlive: true })`; shared across all requests → connection reuse.
* **Concurrency limit:** a tiny **semaphore** throttles in-flight GETs to `k`.
* **Retries:** on **5xx** responses (and selected transient network errors) up to **2** attempts with simple backoff.
* **Timeouts:** per-request timeout via `req.setTimeout(...)` that destroys the request.
* **Mix of http/https:** protocol sniffing picks the correct module and agent.

---

## Tiny sanity test ideas

```js
// 1) Spin up two servers (http & https or two http with different ports) and hit them mixed.
// 2) Add an endpoint that returns 500 twice then 200 to verify retry.
// 3) Log server connection counts to confirm keep-alive reuse (few TCP handshakes).
```

---

### Notes / tweaks

* Tune `maxSockets`, `maxFreeSockets`, and timeouts per workload.
* For very large responses, stream to disk instead of buffering `body`.
* If you only want to retry on **5xx** (strictly per prompt), remove the transient network error codes in `shouldRetry`.
* For **idempotency**, we only GET; if you extend to POST/PUT, reconsider retry rules carefully.
