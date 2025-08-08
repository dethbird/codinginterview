**common-gotchas.md**

# Common Gotchas (Node + TS) — what trips candidates & how to fix fast

> These are the “I’ve seen this break prod” issues. Each item gives the pitfall, why it happens, and a drop-in fix or pattern. Great for interview rapid-fire.

------

## Async/Await & Promises

### Forgot to `await` (lost errors / race conditions)

```ts
// BAD
doWork(); // fire-and-forget by accident

// GOOD
await doWork();
```

If you intentionally fire-and-forget, **document it** and attach a `.catch()`:

```ts
void doWork().catch(err => log.error({ err }, 'bg_task_failed'));
```

### Swallowed errors in handlers

```ts
// BAD (Express): throws won't be caught
app.get('/x', async (_req, res) => { throw new Error('boom'); });

// GOOD: use an async wrapper
export const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

### Unhandled Promise Rejections

```bash
# dev
node --unhandled-rejections=strict src/server.js
```

Or handle globally (still fix root cause):

```ts
process.on('unhandledRejection', (err) => { log.fatal({ err }, 'unhandled_rejection'); process.exit(1); });
```

------

## Express: middleware order & response flow

### Body parser before routes

```ts
app.use(express.json({ limit: '1mb' }));  // before app.use('/api', routes)
```

### CORS before routes

```ts
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
```

### Error handler last & only once

```ts
app.use(routes);
app.use(errorHandler); // ErrorRequestHandler(err, req, res, next)
```

### “Cannot set headers after they are sent”

Return/`else` after responding:

```ts
if (!ok) return res.status(400).json({ error: 'bad' });
// ...do not continue writing to res
```

------

## Input validation & coercion

### Strings in `process.env` (booleans/numbers)

```ts
import { z } from 'zod';
const Env = z.object({
  PORT: z.coerce.number().default(3000),
  ENABLE_SIGNUPS: z.coerce.boolean().default(true),
});
const env = Env.parse(process.env);
```

### Parsing IDs/ints from params

```ts
const id = Number.parseInt(req.params.id, 10);
if (Number.isNaN(id)) return res.status(400).json({ error: 'id_invalid' });
```

### Zod: `parse` vs `safeParse`

```ts
const r = Schema.safeParse(req.body);
if (!r.success) return res.status(422).json({ error: 'validation', issues: r.error.flatten() });
```

------

## ESM vs CJS quirks

### `__dirname` & file URLs (ESM)

```ts
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
```

### Extensioned imports with NodeNext

When using pure Node ESM + `moduleResolution: NodeNext`, include extensions:

```ts
import { foo } from './util.js'; // not .ts at runtime
```

In dev, `tsx` (bundler-style) avoids this; in prod compile to JS.

------

## Event loop blocking (sync CPU in request path)

### bcrypt/crypto sync calls freeze the loop

```ts
// BAD
import { pbkdf2Sync } from 'node:crypto';
const hash = pbkdf2Sync(pw, salt, 150_000, 32, 'sha256'); // blocks

// GOOD (async) or move to Worker Thread
import { pbkdf2 } from 'node:crypto';
const hash = await new Promise<Buffer>((res, rej) => pbkdf2(pw, salt, 150_000, 32, 'sha256', (e, b) => e?rej(e):res(b)));
```

### Big `JSON.stringify` in hot path

Use streams/chunking or precompute/cache heavy payloads.

------

## Streams & files

### Reading entire file into memory

```ts
// BAD
const buf = await fs.promises.readFile(src);
await fs.promises.writeFile(dst, buf);

// GOOD: pipeline (handles backpressure)
import { pipeline } from 'node:stream/promises';
await pipeline(fs.createReadStream(src), fs.createWriteStream(dst));
```

### Remember backpressure when sending to WS/HTTP

Check `bufferedAmount` (WS) or `res.write()` return value; pause when false.

------

## HTTP clients & timeouts

### No timeout → hung requests

```ts
// fetch
const ac = new AbortController();
const t = setTimeout(() => ac.abort(), 5000);
try { await fetch(url, { signal: ac.signal }); } finally { clearTimeout(t); }
```

### Retrying non-idempotent requests

Only retry **idempotent** calls (GET, or writes with idempotency keys). Backoff + jitter.

------

## Security “easy to miss”

### CORS: `*` + credentials = broken

```ts
app.use(cors({
  origin: (o, cb) => cb(null, !o || allowlist.has(o)),
  credentials: true
}));
```

### SQL/NoSQL injection

- Use **parameterized queries/ORM**.
- For Mongo, sanitize operators (`$ne`, `$gt`) from uncontrolled merge into queries.

### JWT verification vs decode

```ts
// BAD: jwt.decode(token)  // does NOT verify
// GOOD:
jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'], audience: 'web', issuer: 'api' });
```

### Cookies in modern browsers

Set `Secure`, `HttpOnly`, `SameSite=Lax` (or `None` + `Secure` for cross-site).

------

## Logging & secrets

### Don’t leak secrets in logs

Use pino redaction:

```ts
import pino from 'pino';
const log = pino({ redact: { paths: ['req.headers.authorization', 'password', 'token'], censor: '[REDACTED]' } });
```

------

## DB pooling & transactions

### Too many connections (PM2/cluster)

Each worker creates its own pool → multiply connections. Lower pool size or avoid over-clustering.

### Leaking clients (pg)

```ts
const c = await pool.connect();
try { /* ... */ } finally { c.release(); }
```

### Race on “check-then-insert”

Rely on **unique index**, catch conflict:

```ts
try { await prisma.user.create({ data: { email } }); }
catch (e: any) { if (isUniqueViolation(e)) throw new Conflict('email_exists'); else throw e; }
```

------

## Dates & timezones

### Local vs UTC confusion

Use **ISO strings** in APIs; store timestamps in UTC.

```ts
new Date().toISOString(); // 2025-08-08T12:34:56.789Z
```

Never parse ambiguous `MM/DD/YYYY` from users without locale awareness.

------

## File uploads

### Unbounded uploads → OOM

- Set `limits.fileSize` (multer) or prefer **signed URLs** to S3/GCS.

```ts
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
```

------

## HTTP server settings

### Keep-alive & header limits

- Set reverse proxy/LB timeouts above your longest request; send regular progress/heartbeats for long streams.
- Protect against giant bodies: `express.json({ limit: '1mb' })`.

------

## E2E tests flakiness

### Binding ports in tests

Use Supertest against the app instance (no `.listen()`).

```ts
import request from 'supertest';
const res = await request(app).get('/health').expect(200);
```

### Async tests not awaited

Always `return`/`await` the Promise in the test; for callbacks use `done` or wrap in a Promise.

------

## Graceful shutdown (deploys/restarts)

### Ignoring SIGTERM

```ts
const server = app.listen(PORT);
['SIGTERM','SIGINT'].forEach(sig => process.on(sig, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}));
```

------

## Docker basics that bite

- Forgot `NODE_ENV=production` → slow Express, bigger memory.
- Alpine + native modules → need `python3 make g++` in build, or use `-slim`.
- Non-root user (`USER node`) and correct file ownership (`--chown` on COPY).

------

## Path traversal when serving files

```ts
import path from 'node:path';
const base = path.join(__dirname, 'public');
const requested = path.normalize(path.join(base, req.path));
if (!requested.startsWith(base)) return res.status(403).end();
res.sendFile(requested);
```

------

## Streams/Intervals leaking

### `setInterval` without cleanup

```ts
const t = setInterval(tick, 1000);
// on shutdown
process.on('SIGTERM', () => clearInterval(t));
```

Prefer `.unref()` for background intervals that shouldn’t keep the process alive:

```ts
setInterval(tick, 30_000).unref();
```

------

## Schema drift / migrations

- Deploy order: **additive** migration → deploy code using new fields → **cleanup**.
- Never drop/rename columns in the same release that still has old code paths.

------

## Response caching & ETags

### Not using ETags for static-ish endpoints

```ts
res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
res.setHeader('ETag', etag);
if (req.headers['if-none-match'] === etag) return res.status(304).end();
```

------

## Socket.IO/WebSocket quirks

- Need **sticky sessions** behind LB (long-lived connections).
- Add **heartbeats** (pings) and **max payload** caps.
- Validate messages (Zod) before acting.

------

## Interview-speed cheat lines

- “I validate at the **edge** (Zod), **coerce** envs, and **return** immediately after sending a response to avoid double-writes.”
- “I avoid blocking the event loop (no sync crypto/compression); heavy work goes to **Workers**.”
- “I set **timeouts** and use **AbortController** for upstream calls; retries only on **idempotent** ops.”
- “Each cluster worker multiplies DB pools; I size pools accordingly and **release clients**.”
- “In ESM, I reconstruct **`__dirname`** from file URL; for NodeNext I include **file extensions**.”

------

Want me to finish **api-starter-template.md** next?