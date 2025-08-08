**http-logging-morgan.md**

# HTTP Logging with Morgan

## 📌 What & why

**Morgan** is a tiny HTTP request logger middleware for Express. It writes one log line per request with **method, path, status, duration**, etc. It’s great for **access logs** and quick local debugging. In production, either send Morgan’s output to your **structured logger** (Pino/Winston) or skip Morgan entirely and use `pino-http`.

------

## Install & basic setup

```bash
npm i morgan
// log-http.ts
import morgan from 'morgan';
import express from 'express';

export const app = express();

// Simple built-in format for local dev
app.use(morgan('dev')); // e.g., "GET /users 200 12.345 ms - 123"
```

**Common built-in formats**

- `'dev'`: concise color-coded dev output
- `'combined'`: Apache-style (includes referrer/user-agent)
- `'common'`, `'tiny'`
- Or pass a **format string** or **custom function** for full control

------

## Arguments & options you’ll actually use

```ts
morgan(format?: string | FormatFn, options?: {
  immediate?: boolean;              // log at request start (default end)
  skip?: (req, res) => boolean;     // conditionally suppress logs
  stream?: { write(str: string): void }; // redirect output (e.g., to Pino)
})
```

- **`immediate`**: set `true` to log before response (useful when debugging crashes before response ends).
- **`skip(req,res)`**: return `true` to **not** log (health checks, static assets).
- **`stream.write(str)`**: forward lines to another logger or writable stream.

------

## Production pattern: JSON logs to your logger

Use a custom formatter that returns a single **JSON line**, then pipe to Pino/Winston.

```ts
import morgan from 'morgan';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });

// Add a request id earlier in the pipeline (or use a request-id middleware)
import { randomUUID } from 'node:crypto';
app.use((req, _res, next) => { (req as any).id = req.headers['x-request-id'] || randomUUID(); next(); });

// JSON formatter
const jsonFormat: morgan.FormatFn = (tokens, req: any, res) => JSON.stringify({
  time: new Date().toISOString(),
  level: 'info',
  msg: 'http_request',
  reqId: req.id,
  method: tokens.method(req, res),
  url: tokens.url(req, res),
  status: Number(tokens.status(req, res)),
  res_bytes: Number(tokens.res(req, res, 'content-length') || 0),
  referrer: tokens.referrer(req, res),
  user_agent: tokens['user-agent'](req, res),
  response_time_ms: Number(tokens['response-time'](req, res))
});

// Wire up Morgan → Pino
app.use(morgan(jsonFormat, {
  stream: { write: (line) => log.info(JSON.parse(line)) },
  skip: (req) => req.path === '/health' || req.method === 'OPTIONS'
}));
```

**Why**: keeps logs **structured** and attachable to traces/metrics. Skip noisy routes.

------

## Custom tokens (add app context)

```ts
// morgan.token(name, callback(req, res))
morgan.token('reqId', (req: any) => req.id as string);
morgan.token('real-ip', (req) => req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip);

// Use in a string format
app.use(morgan(':reqId :real-ip :method :url :status :response-time ms'));
```

> If you’re behind a proxy or load balancer, set `app.set('trust proxy', true)` so `req.ip` reflects the real client IP.

------

## Redacting sensitive bits

Avoid logging **Authorization** headers, cookies, or PII. Morgan doesn’t log bodies by default (good), but referrers and URLs might carry secrets in query strings.

```ts
// Mask query strings by logging only pathname
morgan.token('safe-url', (req) => new URL(req.originalUrl, `http://${req.headers.host}`).pathname);
app.use(morgan(':method :safe-url :status :response-time ms')); // no query params
```

------

## Filter noise (health checks, static assets)

```ts
app.use(morgan('tiny', {
  skip: (req) =>
    req.path === '/health' ||
    req.method === 'HEAD' ||
    req.path.startsWith('/assets/')
}));
```

------

## “Immediate” logs for debugging failures

```ts
// Useful when responses never finish (timeouts, crashes)
app.use(morgan('tiny', { immediate: true }));
```

------

## Send to files (legacy servers, not containers)

If you must log to a file (on a VM), use `stream` with a rotating file stream.

```ts
import rfs from 'rotating-file-stream'; // npm i rotating-file-stream
const accessLog = rfs.createStream('access.log', { interval: '1d', path: '/var/log/app' });
app.use(morgan('combined', { stream: accessLog }));
```

> In containers/K8s, prefer **stdout** and let the platform handle shipping & rotation.

------

## Combining Morgan with Pino/Winston

- **Don’t double-log** full requests. If you use `pino-http` (which already logs method/url/status/duration), you generally **don’t need Morgan**.
- If you like Morgan’s formatting but want structured logs, **pipe Morgan → Pino** (JSON formatter above).

------

## Real-world Express example

```ts
import express from 'express';
import morgan from 'morgan';

const app = express();
app.set('trust proxy', true);

// Lightweight dev format locally
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Prod JSON to stdout (collector friendly)
if (process.env.NODE_ENV === 'production') {
  const fmt: morgan.FormatFn = (t, req, res) => JSON.stringify({
    t: new Date().toISOString(),
    lvl: 'info',
    m: t.method(req, res),
    p: new URL((req as any).originalUrl || req.url, 'http://x').pathname,
    s: Number(t.status(req, res)),
    rt: Number(t['response-time'](req, res)),
    ua: t['user-agent'](req, res)
  });
  app.use(morgan(fmt, { skip: (req) => req.path === '/health' }));
}

app.get('/health', (_req, res) => res.json({ ok: true }));

export { app };
```

------

## Troubleshooting & tips

- Seeing `- -` for bytes or status? That’s normal on errors/early aborts.
- High RPS? Prefer **structured JSON** and avoid heavy string concatenation in custom formatters.
- Need per-route sampling? Use `skip()` with a random gate on noisy routes.
- Add a **request id** early; include it in logs to correlate with app logs and traces.

------

## ✅ Interview Tips

- “Morgan is a **request logger**; I use it for **access logs** and quick dev visibility.”
- “In prod I either **pipe Morgan into Pino** as JSON or **replace** it with `pino-http` to avoid double logging.”
- “I use `skip` for `/health` and static assets, custom tokens for **reqId** and **real client IP**, and I avoid logging query strings with secrets.”