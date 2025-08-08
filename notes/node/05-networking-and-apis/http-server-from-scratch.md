**http-server-from-scratch.md**

# HTTP server from scratch (no frameworks)

## 📌 What & why

Use Node’s **`http`** module when you need **full control**: timeouts, streaming, low deps, or to impress in interviews by showing you understand the wire. We’ll build small, real endpoints with **routing**, **safe body parsing**, **timeouts**, **streaming**, and **error handling**.

------

## Minimal server (with sane timeouts)

```js
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  // We'll route below
  try { await router(req, res); }
  catch (e) { sendJson(res, 500, { error: 'internal_error' }); }
});

server.requestTimeout = 60_000;   // whole request lifetime
server.headersTimeout = 65_000;   // header parsing
server.keepAliveTimeout = 5_000;  // idle keep-alive sockets

server.listen(process.env.PORT || 3000);
```

------

## Helpers you’ll actually use at work

### Parse URL safely

```js
function parseUrl(req) {
  // req.url has only path+query; build a base to use WHATWG URL
  const host = req.headers.host || 'localhost';
  return new URL(req.url || '/', `http://${host}`);
}
```

### Send JSON (sets headers & handles backpressure)

```js
function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': buf.length
  });
  res.end(buf);
}
```

### Read a JSON body with limits (and type checks)

```js
import { pipeline } from 'node:stream/promises';

async function readJsonBody(req, { limit = 256_000, requiredType = 'application/json' } = {}) {
  const ct = (req.headers['content-type'] || '').split(';')[0].trim();
  if (ct !== requiredType) throw Object.assign(new Error('unsupported_media_type'), { code: 415 });

  let size = 0;
  const chunks = [];
  req.on('aborted', () => { throw Object.assign(new Error('client_aborted'), { code: 499 }); });

  await pipeline(req, async function* (source) {
    for await (const chunk of source) {
      size += chunk.length;
      if (size > limit) throw Object.assign(new Error('payload_too_large'), { code: 413 });
      chunks.push(chunk);
    }
  });

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('bad_json'), { code: 400 });
  }
}
```

------

## Tiny router (method + path)

```js
async function router(req, res) {
  const url = parseUrl(req);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, uptime: process.uptime() });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/users/')) {
    const id = decodeURIComponent(url.pathname.slice('/users/'.length));
    // fetch from DB, here mocked:
    return sendJson(res, 200, { id, name: 'Alice' });
  }

  if (req.method === 'POST' && url.pathname === '/users') {
    try {
      const body = await readJsonBody(req, { limit: 64_000 });
      // validate minimal fields
      if (typeof body.email !== 'string') return sendJson(res, 422, { error: 'invalid_email' });
      // insert into DB...
      return sendJson(res, 201, { id: 123, ...body });
    } catch (e) {
      return sendJson(res, e.code ?? 400, { error: e.message });
    }
  }

  sendJson(res, 404, { error: 'not_found' });
}
```

------

## Streaming a file (download) with backpressure

```js
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

async function serveDownload(req, res, fileName) {
  const safe = path.basename(fileName); // prevent traversal
  const p = path.join(process.cwd(), 'files', safe);
  const rs = fs.createReadStream(p);
  res.writeHead(200, {
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename="${safe}"`
  });
  try { await pipeline(rs, res); }
  catch { if (!res.headersSent) res.writeHead(404).end(); }
}
```

Use it in the router:

```js
if (req.method === 'GET' && url.pathname.startsWith('/download/')) {
  return serveDownload(req, res, url.pathname.split('/').pop());
}
```

------

## Conditional GET (ETag) — simple cache win

```js
import crypto from 'node:crypto';

function sendCachedJson(res, req, status, obj) {
  const body = JSON.stringify(obj);
  const etag = `"${crypto.createHash('sha1').update(body).digest('hex')}"`;
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { etag }); return res.end();
  }
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    etag
  });
  res.end(body);
}
```

------

## 100-Continue (accept/reject big uploads early)

```js
const server = http.createServer();
server.on('checkContinue', (req, res) => {
  if ((req.headers['content-type'] || '').startsWith('application/json')) {
    res.writeContinue(); // tell client to send body
    router(req, res);
  } else {
    res.writeHead(415).end();
  }
});
server.on('request', router);
```

------

## Security & robustness checklist (core-only)

- **Validate `Content-Type`** and **limit sizes** on POST/PUT.
- Always use `new URL(req.url, base)`—avoid manual string slicing for queries.
- Sanitize any **path segments** (`path.basename`) to avoid `../` traversal.
- Set explicit **timeouts** (server + upstream clients).
- Respect **backpressure** (`pipeline` for streaming).
- Handle **client disconnects** (`req.on('aborted'|'close', ...)`).
- Never echo raw errors to clients; log internally.

------

## Structured logging (quick, dependency-free)

```js
function log(req, res, extra = {}) {
  const entry = {
    ts: new Date().toISOString(),
    ip: req.socket.remoteAddress,
    method: req.method,
    url: req.url,
    status: res.statusCode,
    ua: req.headers['user-agent'],
    ...extra
  };
  process.stdout.write(JSON.stringify(entry) + '\n');
}
```

Call after responding:

```js
sendJson(res, 200, data); log(req, res);
```

------

## Interview-ready talking points

- Explain **why** you’d hand-roll HTTP: minimal deps, custom streaming, perf.
- Show **timeouts, backpressure, safe JSON parsing, ETag**.
- Mention **100-continue** for upload ergonomics.
- Stress **security**: type checks, size limits, traversal prevention, error hygiene.

------

Next: **express-basics-routing.md** (same goals but with Express: routing, middleware, params, streaming, and best practices).