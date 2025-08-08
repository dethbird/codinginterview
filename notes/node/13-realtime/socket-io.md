**socket-io.md**

# Socket.IO (namespaces, rooms, auth, scale)

## 📌 What & why

**Socket.IO** wraps WebSocket with **auto-reconnect**, **fallbacks**, **namespaces**, **rooms**, and a familiar **event** API. Use it when you want batteries included (rooms, acks, middlewares), not raw `ws`.

------

## Install & server bootstrap

```bash
npm i socket.io
# if attaching to Express with CORS
npm i express
// server.ts
import http from 'node:http';
import express from 'express';
import { Server, type Socket } from 'socket.io';

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: ['https://app.example.com', 'http://localhost:5173'], credentials: true },
  serveClient: false,          // don’t serve socket.io.min.js if you ship your own
  pingInterval: 20000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1 * 1024 * 1024 // 1MB payload cap
});

httpServer.listen(3000);
```

**Key constructor params (args you’ll use):**

- `cors.origin`, `cors.credentials`: browser connect control.
- `pingInterval`, `pingTimeout`: heartbeat timings (affect disconnect detection).
- `maxHttpBufferSize`: cap incoming event payloads (DoS guard).
- `serveClient`: disable built-in client file in prod bundlers.
- `allowEIO3`: support old Engine.IO v3 clients (legacy).

------

## Auth (handshake) & middleware

### 1) JWT via `auth` payload

```ts
// server
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  try {
    if (!token) return next(new Error('unauthorized'));
    const user = verifyJwt(token); // your function
    (socket as any).user = user;
    next();
  } catch { next(new Error('unauthorized')); }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  socket.emit('welcome', { userId: user.sub });
});
// client
import { io as client } from 'socket.io-client';
const socket = client('https://api.example.com', {
  transports: ['websocket'],     // avoid long-poll if you want
  auth: { token: myJwt },        // sent during handshake only
  reconnection: true,
  reconnectionDelayMax: 5000     // backoff cap
});
```

### 2) Cookie/session auth

If your HTTP app already has cookie sessions, share the session store in middleware; read `socket.request.headers.cookie` and validate the session.

------

## Namespaces & rooms

```ts
// Namespaces create isolated event spaces
const chatNsp = io.of('/chat');

chatNsp.on('connection', (socket) => {
  // Rooms are dynamic groups (string IDs)
  socket.on('room:join', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('system', `${socket.id} joined`);
  });

  socket.on('chat:send', ({ roomId, text }) => {
    chatNsp.to(roomId).emit('chat:new', { from: socket.id, text });
  });

  socket.on('disconnect', (reason) => {
    // reason examples: 'transport close', 'ping timeout', 'server namespace disconnect'
    console.log('bye', socket.id, reason);
  });
});
```

**Targeting**

- `io.emit(event, data)` → everyone, all namespaces
- `io.of('/chat').emit(...)` → namespace
- `io.to(room)` / `socket.to(room)` → room broadcast
- `socket.broadcast.emit(...)` → everyone except me (namespace)
- `socket.rooms` → Set of rooms the socket is in (includes its own id)

------

## Acknowledgements (client ↔ server request/response)

```ts
// server
io.on('connection', (socket) => {
  socket.on('calc:add', (a: number, b: number, ack: (sum: number) => void) => {
    ack(a + b); // callback completes the request
  });
});

// client
socket.emit('calc:add', 2, 3, (sum: number) => {
  console.log(sum); // 5
});
```

------

## Type safety (handy in TS)

```ts
// types.ts
export interface ServerToClient {
  'chat:new': { from: string; text: string };
  'system': string;
}
export interface ClientToServer {
  'chat:send': { roomId: string; text: string };
  'room:join': string;
}

import { Server, Socket } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';

type IOServer = Server<ClientToServer, ServerToClient, DefaultEventsMap, any>;
type IOSocket = Socket<ClientToServer, ServerToClient>;

const io = new Server as IOServer;
io.on('connection', (socket: IOSocket) => { /* ... */ });
```

------

## Rate limiting & payload bounds

```ts
// Simple token bucket per socket
const LIMIT = 20; // messages per 10s
const WINDOW = 10_000;
io.on('connection', (socket) => {
  let tokens = LIMIT;
  let ts = Date.now();

  socket.use((packet, next) => {
    const now = Date.now();
    const refill = Math.floor((now - ts) / WINDOW) * LIMIT;
    if (refill) { tokens = Math.min(LIMIT, tokens + refill); ts = now; }
    if (tokens <= 0) return next(new Error('rate_limited'));
    tokens--;
    next();
  });
});
```

Also set `maxHttpBufferSize` on server options and validate JSON schema for each event.

------

## Reconnection strategy (client)

```ts
const socket = client(url, {
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,      // start
  reconnectionDelayMax: 5000,  // cap
  randomizationFactor: 0.5     // jitter
});

socket.on('reconnect', (n) => console.log('reconnected', n));
socket.on('reconnect_error', console.error);
socket.on('reconnect_attempt', (n) => {
  // reattach fresh auth if needed
  socket.auth = { token: refreshJwt() };
});
```

------

## Broadcasting across processes (Redis adapter)

When you run multiple app instances, the in-memory room registry is per-process. Use the **Redis adapter** so emits reach all instances.

```bash
npm i @socket.io/redis-adapter redis
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL! });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

**Sticky sessions:** Long-lived connections must stick to the same instance.

- **Nginx**: `ip_hash;` or cookie-based sticky.
- **Cloud LBs**: ALB/NLB stickiness enabled.
   Pair **stickiness** with the **Redis adapter** for cross-node room messaging.

------

## Security checklist

- **CORS**: set `cors.origin` allowlist; don’t use `*` with credentials.
- **Auth**: verify **once** at handshake (middleware). Consider re-check on privileged actions.
- **Payload limits**: `maxHttpBufferSize`, schema validate, and reject binary uploads unless intended.
- **Rate limit**: throttle events per socket (middleware above) and per IP at HTTP upgrade if needed.
- **Rooms exposure**: don’t echo room IDs you don’t want users to guess; authorize membership.
- **Origin/CSWSH**: Socket.IO uses HTTP upgrade; validate `Origin` header if exposing to browsers.
- **TLS**: always `wss://` in prod.

------

## Performance knobs

- Prefer `transports: ['websocket']` in modern browsers (skip long-poll).

- Avoid huge JSON; send **diffs** or **server-filtered** streams.

- Use `volatile` events for non-critical updates (drop if not ready):

  ```ts
  io volatile emit
  io.volatile.emit('ticker', payload); // ok to drop during congestion
  ```

- Control per-message compression:

  ```ts
  io.compress(false).to(room).emit('chat:new', msg);
  ```

------

## File/binary notes

Socket.IO supports binary (ArrayBuffer/Buffer), but it’s not optimized for large file transfer. For files:

- Upload via HTTP (signed URLs), then notify via socket event.

------

## Admin UI & instrumentation (optional)

There’s an admin UI package for monitoring rooms/sockets; in most prod setups, you’ll instead export **metrics**: connected sockets gauge, events/sec, errors, and per-room sizes.

------

## Express integration & versioning

```ts
import { Server } from 'socket.io';
import { createServer } from 'node:http';

const server = createServer(app);
const io = new Server(server, { /* options */ });

app.set('io', io); // if you need to emit from HTTP routes
```

**Versioning**
 Keep server and client **major versions** aligned (e.g., server 4.x ↔ client 4.x). Mismatches can cause handshake errors.

------

## Testing patterns

- **Unit**: call handlers directly with fake sockets (small wrapper).
- **Integration**: spin server on ephemeral port + `socket.io-client` in tests.

```ts
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

it('chat flow', (done) => {
  const httpServer = createServer().listen();
  const io = new Server(httpServer);
  io.on('connection', (s) => s.on('ping', (_, ack) => ack('pong')));

  const url = `http://localhost:${(httpServer.address() as any).port}`;
  const client = Client(url);

  client.emit('ping', null, (resp: string) => {
    expect(resp).toBe('pong');
    client.close(); io.close(); httpServer.close(); done();
  });
});
```

------

## Common disconnect reasons (server-side)

- `'transport close'` — network/socket closed
- `'ping timeout'` — client missed pings
- `'server namespace disconnect'` — you called `socket.disconnect()`
- `'io server disconnect'` — server kicked the client with a message

You can `socket.disconnect(true)` to close and **prevent** auto-reconnect.

------

## Troubleshooting

- **Works locally, fails behind proxy** → ensure proxy forwards `Upgrade` and `Connection` headers; enable **sticky sessions**.
- **Random drops on mobile** → increase `pingTimeout`, implement client resume logic (re-join rooms/re-auth on reconnect).
- **High CPU** → huge broadcasts or JSON stringification; profile and send smaller deltas; consider `volatile`.
- **No events cross instances** → missing Redis adapter or stickiness; set both.

------

## ✅ Interview Tips

- “I authenticate with **middleware** at handshake, use **namespaces/rooms** for scoping, and **acks** for request/response semantics.”
- “For scale, I enable **sticky sessions** and the **Redis adapter** so rooms/broadcasts work across instances.”
- “I cap payloads with `maxHttpBufferSize`, **rate limit** per socket, and validate schemas for every event.”
- “For non-critical updates I use **volatile** emits; for binary I prefer **HTTP uploads + socket notifications**.”

------

Want to proceed to **14-graphql-and-rpc/apollo-server-basics.md** or jump elsewhere?