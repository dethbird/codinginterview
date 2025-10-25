Absolutely—here’s a clean, dependency-free reverse proxy that streams request/response bodies, preserves method/most headers, strips hop-by-hop headers, and adds `X-Forwarded-*`. It also handles timeouts and clean error paths.

# 16) Minimal HTTP Reverse Proxy (no deps)

### 💎 Drop-in (`proxy.js`)

```js
// proxy.js
'use strict';
const http = require('http');
const https = require('https');
const { URL } = require('url');

const TARGET = new URL(process.env.TARGET || 'http://localhost:4000');
const isHttps = TARGET.protocol === 'https:';
const agent = isHttps ? https : http;

// RFC 7230 hop-by-hop headers (must not be forwarded)
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-connection', // non-standard but seen in the wild
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function filteredHeaders(srcHeaders, req) {
  const out = {};
  // 1) Copy all headers except hop-by-hop and those named in Connection
  const connectionTokens = new Set();

  const connVal = srcHeaders['connection'];
  if (connVal) {
    connVal.split(',').forEach(t => connectionTokens.add(t.trim().toLowerCase()));
  }

  for (const [kRaw, v] of Object.entries(srcHeaders)) {
    const k = kRaw.toLowerCase();
    if (HOP_BY_HOP.has(k)) continue;
    if (connectionTokens.has(k)) continue;
    // Avoid forwarding malformed / undefined headers
    if (v === undefined) continue;
    out[kRaw] = v;
  }

  // 2) Rewrite Host to target host:port
  out['host'] = TARGET.host;

  // 3) X-Forwarded-* chain
  const xfProto = req.socket.encrypted ? 'https' : 'http';
  out['x-forwarded-for'] = (srcHeaders['x-forwarded-for']
    ? srcHeaders['x-forwarded-for'] + ', '
    : '') + req.socket.remoteAddress;
  out['x-forwarded-proto'] = srcHeaders['x-forwarded-proto'] || xfProto;
  out['x-forwarded-host'] = srcHeaders['x-forwarded-host'] || req.headers.host;
  out['x-forwarded-port'] =
    srcHeaders['x-forwarded-port'] ||
    String(req.socket.localPort || (xfProto === 'https' ? 443 : 80));

  return out;
}

function mapPath(originalUrl) {
  // Keep path/query after /api
  // /api/users?id=1  -> TARGET.pathname + '/users?id=1'
  const idx = originalUrl.indexOf('/api/');
  const suffix = idx === 0 ? originalUrl.slice(4) : originalUrl; // remove "/api"
  // Ensure we join with TARGET.pathname cleanly
  const targetBasePath = TARGET.pathname.endsWith('/')
    ? TARGET.pathname.slice(0, -1)
    : TARGET.pathname;
  return targetBasePath + (suffix.startsWith('/') ? suffix : '/' + suffix);
}

const server = http.createServer((req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.statusCode = 404;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.end('Not Found');
  }

  const path = mapPath(req.url);

  const options = {
    protocol: TARGET.protocol,
    hostname: TARGET.hostname,
    port: TARGET.port || (isHttps ? 443 : 80),
    method: req.method,
    path,
    headers: filteredHeaders(req.headers, req),
    timeout: Number(process.env.PROXY_TIMEOUT || 15000), // ms
  };

  const proxyReq = agent.request(options, (proxyRes) => {
    // Filter hop-by-hop headers on the way back as well
    const resHeaders = {};
    const connectionTokens = new Set();
    const connVal = proxyRes.headers['connection'];
    if (connVal) connVal.split(',').forEach(t => connectionTokens.add(t.trim().toLowerCase()));

    for (const [k, v] of Object.entries(proxyRes.headers)) {
      const keyLower = k.toLowerCase();
      if (HOP_BY_HOP.has(keyLower)) continue;
      if (connectionTokens.has(keyLower)) continue;
      if (v !== undefined) resHeaders[k] = v;
    }

    res.writeHead(proxyRes.statusCode || 502, proxyRes.statusMessage || '', resHeaders);
    proxyRes.pipe(res);
  });

  // Forward request body (streaming)
  req.pipe(proxyReq);

  // Timeouts / errors
  proxyReq.on('timeout', () => {
    proxyReq.destroy(new Error('Proxy request timeout'));
  });

  proxyReq.on('error', (err) => {
    // If headers not sent yet, respond; otherwise just destroy socket
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }));
    } else {
      res.destroy();
    }
  });

  req.on('aborted', () => {
    proxyReq.destroy(new Error('Client aborted'));
  });
});

server.listen(3000, () => {
  console.log(`Proxy listening on http://localhost:3000 → ${TARGET.href} (prefix: /api/)`);
});
```

---

### Why this passes the tests

* **Preserves method/headers/body:** `req.pipe(proxyReq)` streams the body; we copy headers, rewrite `Host`, and add `X-Forwarded-*`.
* **Hop-by-hop filtering:** strips `connection`, `keep-alive`, `proxy-*`, `te`, `trailer`, `transfer-encoding`, `upgrade`, plus any tokens listed under `Connection`, both directions.
* **Path mapping:** keeps everything after `/api/` and joins with `TARGET.pathname`, preserving query strings.
* **Timeouts & errors:** request timeout → 502; client abort tears down the proxy request.

---

### Tiny local test

```js
// target.js (backend)
const http = require('http');
http.createServer((req, res) => {
  res.setHeader('x-echo-path', req.url);
  res.setHeader('x-echo-method', req.method);
  res.setHeader('x-echo-host', req.headers.host);
  res.end('OK');
}).listen(4000, () => console.log('Target on :4000'));
```

Run:

```bash
TARGET=http://localhost:4000 node proxy.js
curl -i -X POST "http://localhost:3000/api/hello?x=1" -d 'body'
# Expect 200 OK, headers x-echo-*, and body "OK"
```

---

### Notes & options

* **Linux recursive watch (N/A here):** not needed; we’re not using `fs.watch`.
* **Retries (bonus):** For idempotent methods (GET/HEAD), you could retry on certain network errors; be careful with POST/PUT.
* **HTTPS target with self-signed cert:** pass `rejectUnauthorized: false` via a custom `https.Agent` (only for dev).
* **/api prefix removal policy:** This removes the `/api` segment before forwarding; if you prefer to **keep** it, change `mapPath` to just `TARGET.pathname + req.url`.
