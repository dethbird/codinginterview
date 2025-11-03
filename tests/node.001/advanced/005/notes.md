Here’s a clean, dependency-free reverse proxy that handles both normal HTTP requests to `/api/*` **and** `Upgrade: websocket` requests to the same target. It:

* preserves method/headers,
* streams bodies with backpressure (via `pipe`),
* strips hop-by-hop headers,
* adds `X-Forwarded-*`,
* supports `ws://` and `wss://` (TLS) upgrades via `net`/`tls`,
* cleans up sockets on errors / half-open situations.

# 5) WebSocket Upgrade Proxy (no deps)

```js
// ws-proxy.js
'use strict';
const http = require('http');
const https = require('https');
const net = require('net');
const tls = require('tls');
const { URL } = require('url');

const TARGET = new URL(process.env.TARGET || 'http://localhost:4000');
const isHttps = TARGET.protocol === 'https:';

// ---------- helpers ----------
const HOP = new Set([
  'connection', 'keep-alive', 'proxy-connection',
  'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);

// Remove hop-by-hop and tokens named in Connection
function filterHeaders(src, req) {
  const out = {};
  const connTokens = new Set();
  const conn = src['connection'];
  if (conn) conn.split(',').forEach(t => connTokens.add(t.trim().toLowerCase()));

  for (const [k, v] of Object.entries(src)) {
    const kl = k.toLowerCase();
    if (v === undefined) continue;
    if (HOP.has(kl)) continue;
    if (connTokens.has(kl)) continue;
    out[k] = v;
  }
  // Rewrite Host to target
  out.host = TARGET.host;

  // X-Forwarded-*
  const proto = req.socket.encrypted ? 'https' : 'http';
  out['x-forwarded-for'] = (src['x-forwarded-for'] ? src['x-forwarded-for'] + ', ' : '') + req.socket.remoteAddress;
  out['x-forwarded-proto'] = src['x-forwarded-proto'] || proto;
  out['x-forwarded-host'] = src['x-forwarded-host'] || req.headers.host;
  out['x-forwarded-port'] = src['x-forwarded-port'] || String(req.socket.localPort || (proto === 'https' ? 443 : 80));

  return out;
}

function mapApiPath(originalUrl) {
  // strip the /api prefix and join with TARGET.pathname
  const idx = originalUrl.indexOf('/api/');
  const suffix = idx === 0 ? originalUrl.slice(4) : originalUrl; // remove "/api"
  const base = TARGET.pathname.endsWith('/') ? TARGET.pathname.slice(0, -1) : TARGET.pathname;
  return base + (suffix.startsWith('/') ? suffix : '/' + suffix);
}

// ---------- HTTP proxy (for /api/*) ----------
const server = http.createServer((req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.statusCode = 404;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.end('Not Found');
  }

  const path = mapApiPath(req.url);
  const mod = isHttps ? https : http;

  const options = {
    protocol: TARGET.protocol,
    hostname: TARGET.hostname,
    port: TARGET.port || (isHttps ? 443 : 80),
    method: req.method,
    path,
    headers: filterHeaders(req.headers, req),
    timeout: Number(process.env.PROXY_TIMEOUT || 15000),
  };

  const proxyReq = mod.request(options, (proxyRes) => {
    // Filter response hop-by-hop headers too
    const outHeaders = {};
    const connTokens = new Set();
    const conn = proxyRes.headers['connection'];
    if (conn) conn.split(',').forEach(t => connTokens.add(t.trim().toLowerCase()));

    for (const [k, v] of Object.entries(proxyRes.headers)) {
      const kl = k.toLowerCase();
      if (HOP.has(kl)) continue;
      if (connTokens.has(kl)) continue;
      if (v !== undefined) outHeaders[k] = v;
    }

    res.writeHead(proxyRes.statusCode || 502, proxyRes.statusMessage || '', outHeaders);
    proxyRes.pipe(res);
  });

  req.pipe(proxyReq);

  proxyReq.on('timeout', () => proxyReq.destroy(new Error('Proxy timeout')));
  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }));
    } else {
      res.destroy();
    }
  });

  req.on('aborted', () => proxyReq.destroy(new Error('Client aborted')));
});

// ---------- WebSocket upgrade proxy (for /api/*) ----------
server.on('upgrade', (req, clientSocket, head) => {
  if (!req.url.startsWith('/api/')) {
    clientSocket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    return clientSocket.destroy();
  }

  // Prepare upstream TCP/TLS socket
  const connectOpts = {
    host: TARGET.hostname,
    port: Number(TARGET.port || (isHttps ? 443 : 80)),
    servername: TARGET.hostname, // SNI for TLS
  };
  const upstream = isHttps ? tls.connect(connectOpts) : net.connect(connectOpts);

  // Build the HTTP/1.1 upgrade request to upstream
  const path = mapApiPath(req.url);
  const headers = filterHeaders(req.headers, req);

  // Re-add required upgrade headers from original request
  headers['connection'] = 'Upgrade';
  headers['upgrade'] = req.headers['upgrade'] || 'websocket';
  if (req.headers['sec-websocket-key']) headers['sec-websocket-key'] = req.headers['sec-websocket-key'];
  if (req.headers['sec-websocket-version']) headers['sec-websocket-version'] = req.headers['sec-websocket-version'];
  if (req.headers['sec-websocket-protocol']) headers['sec-websocket-protocol'] = req.headers['sec-websocket-protocol'];
  if (req.headers['sec-websocket-extensions']) headers['sec-websocket-extensions'] = req.headers['sec-websocket-extensions'];

  upstream.on('connect', () => {
    // Write request line + headers
    let reqLines = [`GET ${path} HTTP/1.1`];
    for (const [k, v] of Object.entries(headers)) {
      reqLines.push(`${k}: ${v}`);
    }
    reqLines.push('\r\n');
    upstream.write(reqLines.join('\r\n'));

    // If there was any pre-read data (head), forward it
    if (head && head.length) upstream.write(head);

    // Bi-directional piping with backpressure
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);

    // socket hygiene
    clientSocket.setKeepAlive(true);
    upstream.setKeepAlive?.(true);
    clientSocket.setNoDelay(true);
    upstream.setNoDelay?.(true);
  });

  upstream.on('error', (err) => {
    try {
      clientSocket.write(
        'HTTP/1.1 502 Bad Gateway\r\n' +
        'Content-Type: text/plain\r\n' +
        'Connection: close\r\n\r\n' +
        'Bad Gateway'
      );
    } catch {}
    clientSocket.destroy();
  });

  clientSocket.on('error', () => upstream.destroy());

  // If client goes away, tear down upstream (and vice versa)
  clientSocket.on('end', () => upstream.end());
  upstream.on('end', () => clientSocket.end());

  // Timeouts (optional)
  const idleMs = Number(process.env.WS_IDLE_TIMEOUT || 0);
  if (idleMs > 0) {
    clientSocket.setTimeout(idleMs, () => clientSocket.destroy());
    upstream.setTimeout?.(idleMs, () => upstream.destroy());
  }
});

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`WS/HTTP proxy on :${PORT} → ${TARGET.href} (prefix: /api/)`);
});
```

### Why this meets the brief

* **HTTP path:** Proxies only `/api/*`, preserving method/headers/body with streaming and backpressure.
* **WebSocket upgrades:** Handles the `'upgrade'` event, establishes a TCP/TLS connection to the target, forwards the HTTP upgrade handshake, then **pipes both ways**.
* **Header sanitization:** Strips hop-by-hop headers and `Connection` tokens, rewrites `Host`, and appends `X-Forwarded-*`.
* **Error/half-open cleanup:** Destroys the peer socket on error/end; optional idle timeouts; keep-alive + `setNoDelay` for good measure.

### Quick local test

1. Target that echoes WS:

```js
// target.js
const http = require('http');
const crypto = require('crypto');
const srv = http.createServer((req,res)=>res.end('ok'));

srv.on('upgrade', (req, socket) => {
  // Minimal WS accept
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  // raw echo (not proper WS framing; use a real server for production)
  socket.pipe(socket);
});
srv.listen(4000, () => console.log('target :4000'));
```

2. Run proxy:

```bash
TARGET=http://localhost:4000 node ws-proxy.js
```

3. Connect with a WS client (e.g., `websocat` or browser app) to:

```
ws://localhost:3000/api/ws
```

This is the lean, no-deps pattern interviewers look for.
    