**websockets-ws.md**

# WebSockets with `ws` (raw, fast, production-friendly)

## 📌 What & why

**WebSocket** is a persistent, full-duplex TCP channel over HTTP(S) upgrade. Great for **realtime** (chat, presence, live dashboards, game state). The `ws` library is the lean, fast Node choice when you want control and minimal overhead.

> When to *not* use WS: simple server → client pushes can use **SSE (EventSource)**. When you want rooms, fallbacks, and batteries included → see **Socket.IO** (next file).

------

## Install & minimal server

```bash
npm i ws
// ws-server.ts
import http from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

const server = http.createServer(); // your Express app can live here too
const wss = new WebSocketServer({ server, maxPayload: 1 * 1024 * 1024 }); // 1MB cap

wss.on('connection', (ws, req) => {
  ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }));

  ws.on('message', (data, isBinary) => {
    // Always validate & bound payloads
    if (!isBinary) {
      const msg = JSON.parse(data.toString('utf8'));
      // handle msg...
    }
  });

  ws.on('close', (code, reason) => {
    console.log('closed', code, reason.toString());
  });
});

server.listen(3000, () => console.log('HTTP+WS on :3000'));
```

**Key constructor params**

- `new WebSocketServer({ server })` – attach to an existing HTTP(S) server.
- `noServer: true` – if you want to handle the HTTP `upgrade` yourself (useful for auth).
- `perMessageDeflate: true|object` – enable compression (see below).
- `maxPayload: number` – **bytes** cap for incoming messages (prevent memory bloat).
- `clientTracking: true` – keeps `wss.clients` Set (default: true).

------

## Upgrading with **auth** (recommended pattern)

Do **auth during HTTP upgrade**, then accept/deny.

```ts
import { WebSocketServer } from 'ws';
import http from 'node:http';
import url from 'node:url';
import jwt from 'jsonwebtoken';

const server = http.createServer(/* express app or plain */);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  // Basic origin check (CSWSH)
  const origin = req.headers.origin || '';
  if (!/^https:\/\/(app\.example\.com)$/.test(origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); return socket.destroy();
  }

  // Parse token from query or header (prefer header/cookie in real apps)
  const { query } = url.parse(req.url!, true);
  const token = (req.headers['sec-websocket-protocol'] as string) // client can pass a token here
    || (Array.isArray(query.token) ? query.token[0] : query.token);

  try {
    const user = jwt.verify(String(token), process.env.JWT_SECRET!);
    // Attach user to req for use in 'connection' handler
    (req as any).user = user;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  const user = (req as any).user;
  ws.send(JSON.stringify({ type: 'hello', userId: user.sub }));
});
```

**Notes**

- **Origin check** mitigates cross-site WS hijacking. Maintain an allowlist.
- **JWT in `Sec-WebSocket-Protocol`** is a trick when you can’t set headers from browsers’ WS API. Alternatively, use a **cookie** (HttpOnly) and verify the session on upgrade.

------

## Heartbeats (detect dead sockets) & backpressure

```ts
// Heartbeat
function heartbeat(this: WebSocket) { (this as any).isAlive = true; }
wss.on('connection', (ws) => {
  (ws as any).isAlive = true;
  ws.on('pong', heartbeat);
});

const interval = setInterval(() => {
  for (const ws of wss.clients) {
    if (!(ws as any).isAlive) return ws.terminate(); // hard close if unresponsive
    (ws as any).isAlive = false;
    ws.ping(); // triggers 'pong' from peers that are alive
  }
}, 30000).unref();

// Backpressure: don't blast when kernel buffers are full
function safeSend(ws: WebSocket, data: string | Buffer) {
  if (ws.readyState !== ws.OPEN) return;
  if (ws.bufferedAmount > 1 * 1024 * 1024) return; // 1MB backlog → drop or queue
  ws.send(data);
}
```

**Why**: Broken connections (mobile sleep, NAT timeouts) won’t emit `close`. Pings clean them up. `bufferedAmount` prevents memory bloat when consumers are slow.

------

## Message design (versioned, typed, validated)

Use a **framed** JSON protocol: `{type, data}` + **schema validation**.

```ts
// messages.ts
import { z } from 'zod';

export const Msg = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), ts: z.number() }),
  z.object({ type: z.literal('chat:send'), room: z.string(), text: z.string().min(1).max(1000) }),
  z.object({ type: z.literal('subscribe'), topic: z.string() }),
]);
export type Msg = z.infer<typeof Msg>;
// handler.ts
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg: Msg;
    try { msg = Msg.parse(JSON.parse(raw.toString('utf8'))); }
    catch { return ws.send(JSON.stringify({ type: 'error', code: 'bad_msg' })); }

    switch (msg.type) {
      case 'ping': return ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      case 'chat:send': /* broadcast to room ... */ break;
      case 'subscribe': /* add to topic set ... */ break;
    }
  });
});
```

**Tips**

- Include a **`v`** (protocol version) if you expect evolution.
- Keep payloads small; prefer **diffs** or **server-side filtering** over dumping huge arrays.

------

## Broadcasting & rooms (simple in-process)

```ts
// naive in-memory rooms
const rooms = new Map<string, Set<WebSocket>>();

function join(ws: WebSocket, room: string) {
  const set = rooms.get(room) ?? new Set<WebSocket>();
  set.add(ws); rooms.set(room, set);
  ws.once('close', () => set.delete(ws));
}

function broadcast(room: string, data: any, except?: WebSocket) {
  const msg = JSON.stringify(data);
  for (const ws of rooms.get(room) ?? []) {
    if (ws !== except) safeSend(ws, msg);
  }
}
```

------

## Horizontal scaling (multi-instance) with Redis

Use **pub/sub** so all nodes see messages.

```ts
import { createClient } from 'redis';
const pub = createClient({ url: process.env.REDIS_URL! });
const sub = pub.duplicate();

await Promise.all([pub.connect(), sub.connect()]);
await sub.subscribe('room:general', (raw) => {
  // got a message from another instance
  for (const ws of rooms.get('general') ?? []) safeSend(ws, raw);
});

// When you get a local message:
await pub.publish('room:general', JSON.stringify({ type: 'chat:new', text }));
```

> With many rooms, consider sharding channels or encoding `{room}:{event}`. Watch Redis throughput; batch if needed.

------

## Compression (per-message deflate)

```ts
const wss = new WebSocketServer({
  server,
  perMessageDeflate: {
    threshold: 1024, // only compress messages > 1KB
    clientNoContextTakeover: true,
    serverNoContextTakeover: true
  }
});
```

**Trade-off**: saves bandwidth but costs CPU. Typically enable with **threshold** and **no context takeover** to bound memory.

------

## Client (browser) basics

```js
const ws = new WebSocket('wss://api.example.com/realtime', ['jwt.' + token]); // pass token via subprotocol

ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'subscribe', topic: 'prices' })));
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  // handle...
});
ws.addEventListener('close', () => retryConnect());
```

**Reconnect**: use **exponential backoff** with jitter; re-authenticate and re-subscribe on connect.

------

## Security checklist

- **Origin allowlist** on upgrade (reject unexpected `Origin`).
- **Auth**: validate JWT/session at upgrade; **re-check** on important actions if needed.
- **Rate limit** messages per socket (e.g., X msgs/second). Drop/ban on abuse.
- **Max payload** (`maxPayload`) and **schema validation** (Zod/Joi).
- **Backpressure**: respect `bufferedAmount`; drop or queue with size caps.
- **No secrets** in URL query (leaks via logs/analytics); prefer cookie or subprotocol header.
- **TLS** (`wss://`) in prod.

------

## Express integration (one server)

```ts
import express from 'express';
import http from 'node:http';
import { WebSocketServer } from 'ws';

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

server.on('upgrade', (req, socket, head) => {
  // (auth+origin checks here)
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

server.listen(3000);
```

------

## Deploy & ops notes

- **Sticky sessions?** WebSocket is a long-lived TCP connection. If you run multiple instances behind a load balancer, ensure **connection stickiness** (ELB/Nginx `ip_hash`/cookie) or use **L4** routing so the same instance keeps the socket.
- **Idle timeouts**: set LB/ingress timeouts to exceed your heartbeat period; send pings < timeout.
- **Metrics**: export `wss.clients.size` (gauges), message counts, error/close codes, and ping RTTs.

------

## Common close codes (to standardize your app)

- `1000` normal closure
- `1001` going away (server restart/deploy)
- `1008` policy violation (auth/authorization fail)
- `1011` internal error

```ts
ws.close(1008, 'unauthorized');
```

------

## Troubleshooting

- **Connects locally but not in prod** → LB/ingress not forwarding `Upgrade`/`Connection` headers correctly.
- **Random disconnects** → NAT/LB idle timeout; add **pings** and adjust timeouts.
- **Server memory climbs** → missing heartbeat cleanup; unbounded queues; huge `bufferedAmount`.
- **CORS errors in console** → that’s for HTTP; WebSockets use **Origin** checks, not CORS preflight. Fix **Origin** allowlist, not CORS.

------

## ✅ Interview Tips

- “I authenticate on **HTTP upgrade**, allowlist **Origin**, cap **payload**, and implement **heartbeat** + **backpressure**.”
- “For scale, I use **Redis pub/sub** to broadcast across instances and ensure **sticky sessions** at the LB.”
- “I design a **typed message schema** and validate each frame; I enable **permessage-deflate** with thresholds.”
- “When requirements are simple push-only, I’d consider **SSE**. For batteries (rooms, fallbacks), **Socket.IO**.”

------

Ready to cover **socket-io.md** next?