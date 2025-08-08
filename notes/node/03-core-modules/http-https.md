**http-https.md**

# HTTP & HTTPS (core modules)

## 📌 What & why

Low-level HTTP(S) for when you need **full control**: custom timeouts, streaming, backpressure, connection pooling, or proxies. Use **`http`/`https`** for servers/clients; prefer **global `fetch`** for simple client calls, but drop to `http.request` when you need fine-tuning (keep-alive pools, streaming upload/download, custom TLS).

------

## Server-side essentials

```js
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  // req: IncomingMessage (Readable stream)
  // res: ServerResponse   (Writable stream)

  // Basic routing
  if (req.method === 'GET' && req.url?.startsWith('/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  res.writeHead(404).end();
});

// Timeouts: set explicit values in prod
server.requestTimeout = 60_000;   // whole request must finish in 60s
server.headersTimeout = 65_000;   // header parse timeout
server.keepAliveTimeout = 5_000;  // idle keep-alive sockets

server.listen(process.env.PORT || 3000);
```

### `IncomingMessage` (request)

- `req.method` (e.g., `GET`)
- `req.url` (path + query only)
- `req.headers` (lowercased keys)
- `req.httpVersion`, `req.socket`
- Events: `'aborted'`, `'close'`, `'data'`, `'end'`, `'error'`
- Body is a **Readable stream** (use `pipeline`, don’t buffer huge bodies).

### `ServerResponse` (response)

- `res.statusCode`, `res.statusMessage`
- `res.setHeader(name, value)`, `res.getHeader(name)`
- `res.writeHead(status, headers?)`
- `res.write(chunk) -> boolean` (check backpressure)
- `res.end([data])`
- `res.setTimeout(ms, cb?)`

------

## Real-world: read JSON body (with size limit & abort)

```js
import { pipeline } from 'node:stream/promises';

async function readJsonBody(req, { limit = 1_000_000 } = {}) {
  let size = 0;
  const chunks = [];
  req.on('aborted', () => { throw new Error('client aborted'); });

  await pipeline(req, async function*(source) {
    for await (const chunk of source) {
      size += chunk.length;
      if (size > limit) throw new Error('payload too large');
      chunks.push(chunk);
    }
  });

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

// Usage in a route:
if (req.method === 'POST' && req.url === '/users') {
  try {
    const body = await readJsonBody(req, { limit: 256_000 });
    // ... validate, persist ...
    res.writeHead(201, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ id: 123, ...body }));
  } catch (e) {
    const code = String(e.message).includes('too large') ? 413 : 400;
    res.writeHead(code, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: e.message }));
  }
}
```

------

## Real-world: stream a file (backpressure-safe)

```js
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

if (req.method === 'GET' && req.url?.startsWith('/download/')) {
  const name = path.basename(req.url.split('/').pop() || '');
  const file = path.join(process.cwd(), 'files', name);

  const rs = fs.createReadStream(file);
  res.writeHead(200, {
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename="${name}"`
  });
  try { await pipeline(rs, res); }
  catch { if (!res.headersSent) res.writeHead(404).end(); }
}
```

------

## Client-side (fine-grained) with `http.request`

```js
import http from 'node:http';

// Keep-alive agent (connection pooling)
const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });

function httpJson({ hostname, path, method = 'GET', headers = {}, body, timeout = 5000 }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, path, method, headers, agent, timeout }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf8');
        const json = txt ? JSON.parse(txt) : null;
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, headers: res.headers, json });
        } else {
          reject(Object.assign(new Error(`HTTP ${res.statusCode}`), { status: res.statusCode, body: txt }));
        }
      });
    });

    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);

    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      req.setHeader('content-type', req.getHeader('content-type') || 'application/json');
      req.setHeader('content-length', Buffer.byteLength(data));
      req.write(data);
    }
    req.end();
  });
}

// Usage:
const r = await httpJson({ hostname: 'api.internal', path: '/v1/users' });
```

**Key `http.request` options**

- `protocol`, `hostname`, `port`, `path`
- `method`, `headers`
- `timeout` (socket inactivity)
- `agent` (`http.Agent` with `{ keepAlive, maxSockets }`)

------

## HTTPS specifics

```js
import https from 'node:https';

const agent = new https.Agent({
  keepAlive: true,
  // TLS options
  // ca: fs.readFileSync('ca.pem'),
  // cert: fs.readFileSync('client.crt'),
  // key: fs.readFileSync('client.key'),
  // rejectUnauthorized: true,   // keep true in prod
});
```

**TLS options (common)**

- `ca` (custom CA bundle), `cert`/`key` (mutual TLS), `servername` (SNI override)
- `rejectUnauthorized` (don’t disable in prod)
- `ALPNProtocols` if negotiating HTTP/2 (core `http2` is a separate module)

------

## Handling client disconnects (don’t waste work)

```js
const ac = new AbortController();
req.on('close', () => ac.abort(new Error('client closed')));

// Example: abort upstream fetch / long job
someAsyncThing({ signal: ac.signal }).catch(() => {});
```

------

## Expect: 100-continue (upload ergonomics)

```js
const server = http.createServer();
server.on('checkContinue', (req, res) => {
  // Decide if you want the body before reading it
  if (req.headers['content-type'] !== 'application/json') {
    res.writeHead(415).end(); // tell client to stop
  } else {
    res.writeContinue();      // send 100 Continue, then read body
    // ... handle as usual ...
  }
});
```

------

## Compression (simple negotiation)

```js
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';

function maybeGzip(req, res) {
  const ae = req.headers['accept-encoding'] || '';
  if (/\bgzip\b/.test(ae)) {
    res.setHeader('content-encoding', 'gzip');
    return zlib.createGzip({ level: 6 });
  }
  return null;
}

// Usage
const gz = maybeGzip(req, res);
if (gz) await pipeline(Readable.from(JSON.stringify(data)), gz, res);
else    await pipeline(Readable.from(JSON.stringify(data)), res);
```

------

## Gotchas & best practices

- **Always set timeouts** (server + client). Don’t rely on Node defaults.
- **Backpressure**: check `res.write()` return or just use `pipeline`.
- **Keep-alive pooling** for clients via `Agent` dramatically reduces latency.
- **Never trust `req.url` blindly** — parse with `new URL(req.url, base)`.
- **Lowercase header names** when reading `req.headers`. Set canonical names when writing (Node normalizes).
- For huge bodies, **stream** to disk or upstream; don’t `Buffer.concat` in memory.

------

## ✅ Interview Tips

- Explain **why you’d drop to `http.request`** instead of `fetch`.
- Show you know **`Agent`** knobs (`keepAlive`, `maxSockets`) and **timeouts**.
- Demonstrate **streaming** (file download/upload) and **client abort** handling.
- Call out **security** (TLS verify, size limits, content-type checks).

------

Next: **os-and-process.md** (environment, signals, `process.env`, `process.nextTick`, exit codes, `child_process`, and practical lifecycle management).