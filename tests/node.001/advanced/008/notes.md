Awesome—this is a classic sticky-sessions pattern that works without external LB/nginx. The **master** owns the public port (TCP) and consistently assigns each incoming socket to a **worker** based on the client IP hash; the **worker** handles HTTP + WebSocket (upgrade) and gets sockets via `worker.send(..., socket)`.

Here’s a clean, interview-ready drop-in.

# 8) Sticky Sessions for WS with Cluster

```js
// cluster-sticky.js
'use strict';
const cluster = require('cluster');
const os = require('os');
const net = require('net');
const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const WORKERS = Number(process.env.WORKERS || os.cpus().length);

/**
 * Hash an IP (handles IPv6-mapped IPv4 like ::ffff:127.0.0.1).
 * Returns a stable integer >=0.
 */
function hashRemote(addr) {
  if (!addr) return 0;
  // Take the last IPv4 part if it's an IPv6-mapped address
  const m = addr.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  const ip = m ? m[1] : addr;
  // Simple fnv-like hash
  let h = 2166136261;
  for (let i = 0; i < ip.length; i++) {
    h ^= ip.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

if (cluster.isPrimary) {
  // ─────────────── Master: spawn + sticky dispatcher ───────────────
  const workers = [];

  function forkAndTrack() {
    const w = cluster.fork();
    workers.push(w);
    w.on('exit', () => {
      // Remove from our list
      const idx = workers.indexOf(w);
      if (idx !== -1) workers.splice(idx, 1);
      // Respawn to keep pool healthy
      forkAndTrack();
    });
  }

  for (let i = 0; i < WORKERS; i++) forkAndTrack();

  // TCP balancer listens on the public port; pause sockets so workers can resume.
  const balancer = net.createServer({ pauseOnConnect: true }, (socket) => {
    const addr = socket.remoteAddress;
    const id = hashRemote(addr) % workers.length;
    const target = workers[id];

    if (!target || target.isDead()) {
      // Fallback: pick the first live worker
      const live = workers.find(w => w.isConnected());
      if (!live) return socket.destroy();
      live.send({ cmd: 'sticky' }, socket);
      return;
    }

    // Pass the socket handle to the chosen worker
    target.send({ cmd: 'sticky' }, socket);
  });

  balancer.on('error', (err) => {
    console.error('[master] balancer error:', err);
  });

  balancer.listen(PORT, () => {
    console.log(`[master] PID ${process.pid} sticky balancer on :${PORT} with ${WORKERS} workers`);
  });

} else {
  // ─────────────── Worker: HTTP + WS server (no direct listen) ───────────────
  // We DO NOT call server.listen(PORT) here; sockets are injected by master.

  // Minimal HTTP server with an upgrade handler (no deps)
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, pid: process.pid }));
    }
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(`worker pid ${process.pid}\n`);
  });

  // Minimal WebSocket accept (RFC6455) + raw echo (for demo)
  server.on('upgrade', (req, socket, head) => {
    // Only handle /ws (optional)
    if (req.url !== '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      return socket.destroy();
    }

    // Basic WS handshake
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      return socket.destroy();
    }
    const accept = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const hdrs =
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n` +
      '\r\n';

    socket.write(hdrs);

    // Demo echo (NOT full WS framing; for interview/demo only).
    // In real apps, use a WS lib in the worker.
    // For framing-correct echo, you'd need to parse frames; omitted for brevity.
    socket.on('data', (chunk) => {
      // naive pipe back (works only with tools that accept raw echoes)
      socket.write(chunk);
    });

    socket.on('error', () => socket.destroy());
    socket.on('end', () => socket.end());
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
  });

  // Receive sticky sockets from master and hand them to our HTTP server
  process.on('message', (msg, handle) => {
    if (!msg || msg.cmd !== 'sticky') return;
    // `handle` is a net.Socket paused by master (pauseOnConnect: true)
    // Emit 'connection' so Node HTTP server takes ownership. Then resume.
    server.emit('connection', handle);
    handle.resume();
  });

  console.log(`[worker ${process.pid}] ready for sticky sockets`);
}
```

## Why this meets the brief

* **Sticky routing:** master hashes `remoteAddress` → picks worker → `worker.send({ cmd:'sticky' }, socket)`.
* **Socket passing:** uses Node’s built-in handle passing; sockets arrive **paused** (`pauseOnConnect`) and the worker **resumes** after `server.emit('connection', socket)`.
* **WebSocket-ready:** worker handles `'upgrade'` (raw demo shown). Because the **same TCP socket** is routed consistently by hash, WS connections remain stuck to the same worker for their lifetime.
* **No double listening:** only the **master** binds `:PORT`. Workers don’t call `listen`; they consume injected sockets.
* **IPv6/IPv4:** hashing normalizes IPv6-mapped IPv4 (`::ffff:1.2.3.4`).
* **Worker death:** master respawns on exit to keep the pool healthy (existing sticky connections on a dead worker drop as normal TCP behavior; new ones get hashed to a live worker).

## Backpressure & hygiene

* **Backpressure:** preserved naturally—sockets are real TCP sockets; the worker’s HTTP/WS stack will apply backpressure to the socket’s stream.
* **Half-open:** if a client half-closes, Node will emit `end`/`close`; we call `socket.end()`/`destroy()` accordingly.
* **Fairness:** consistent hashing → same client sticks; load distribution is typically good if client IP diversity exists.

## Quick test

```bash
# terminal 1
node cluster-sticky.js

# terminal 2: hit HTTP multiple times; you should see the same worker PID per client
curl -s localhost:3000/ | head -1
curl -s localhost:3000/ | head -1

# WebSocket (using websocat)
websocat ws://localhost:3000/ws
# type and see echoed (raw demo)
```

> In a production service, you’d:
>
> * use a real WebSocket library in the worker (proper framing),
> * add health checks & graceful shutdown,
> * optionally add a seed to the hash and support proxy headers (e.g., `X-Forwarded-For`) if the master sits behind another LB.
