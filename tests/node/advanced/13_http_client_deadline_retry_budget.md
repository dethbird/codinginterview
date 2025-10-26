# 13) HTTP Client Pool with Deadline + Retry Budget

**Goal:** Shared keep-alive Agents, per-request deadline, global retry budget across the batch.

### 💎 Gold answer (`http-deadline-pool.js`)
```js
'use strict';
const http = require('http');
const https = require('https');
const { URL } = require('url');

const HTTP_AGENT = new http.Agent({ keepAlive: true, maxSockets: 50 });
const HTTPS_AGENT = new https.Agent({ keepAlive: true, maxSockets: 50 });

function fetchWithDeadline(urlStr, { ms = 5000, agent } = {}) {
  const u = new URL(urlStr);
  const isHttps = u.protocol === 'https:';
  const mod = isHttps ? https : http;
  const ag = agent || (isHttps ? HTTPS_AGENT : HTTP_AGENT);

  return new Promise((resolve, reject) => {
    const req = mod.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: `${u.pathname}${u.search}`,
      method: 'GET',
      agent: ag,
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    const to = setTimeout(() => req.destroy(new Error('deadline exceeded')), ms);
    req.on('error', reject);
    req.end();
    req.on('close', () => clearTimeout(to));
  });
}

async function getAll(urls, { concurrency = 5, deadlineMs = 3000, maxRetriesTotal = 20 } = {}) {
  let inUseRetries = 0;
  const queue = urls.slice();
  const results = [];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      let attempts = 0;
      while (true) {
        try {
          const r = await fetchWithDeadline(url, { ms: deadlineMs });
          if (r.status >= 500 && inUseRetries < maxRetriesTotal) {
            inUseRetries++; attempts++; continue;
          }
          results.push({ url, status: r.status });
          break;
        } catch (e) {
          if (inUseRetries < maxRetriesTotal) { inUseRetries++; attempts++; continue; }
          results.push({ url, error: e.message });
          break;
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { results, retriesUsed: inUseRetries };
}

module.exports = { fetchWithDeadline, getAll, HTTP_AGENT, HTTPS_AGENT };
```

### Notes
- Global retry budget ensures at most N extra requests across the whole batch.
- Treats all errors/5xx as retryable until budget exhausted.
