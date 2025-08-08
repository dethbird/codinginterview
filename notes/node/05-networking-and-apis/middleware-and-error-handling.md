**middleware-and-error-handling.md**

# Middleware & Error Handling (Express)

## 📌 What & why

**Middleware** is a chain of functions that run for each request: `(req, res, next)`. Use it for cross-cutting concerns: **logging, auth, validation, rate limits, parsing, request IDs**.
 **Error handlers** centralize failures into a single place with a consistent JSON shape.

> Order matters. Middleware runs top-to-bottom. Put **404** and **error handlers last**.

------

## Middleware anatomy (signatures & params)

### Standard middleware

```js
// (req, res, next) => void | Promise<void>
app.use((req, res, next) => {
  // read/modify req, res, or res.locals
  next(); // continue chain
});
```

### Error middleware

```js
// (err, req, res, next) => void
app.use((err, req, res, next) => {
  // central place to format errors
});
```

**Mounting**

```js
app.use(path?, ...fns);       // runs for all HTTP methods under `path`
app.get(path, ...fns);        // route + middleware stack
```

------

## Real-world baseline stack (pasteable)

```js
import express from 'express';
import crypto from 'node:crypto';

const app = express();

// 1) Request ID + timing
app.use((req, res, next) => {
  res.locals.reqId = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', res.locals.reqId);
  res.locals.t0 = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - res.locals.t0) / 1e6;
    process.stdout.write(JSON.stringify({
      ts: new Date().toISOString(),
      id: res.locals.reqId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms: +ms.toFixed(2),
      ua: req.get('user-agent')
    }) + '\n');
  });
  next();
});

// 2) Body parsers with limits
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// 3) Simple auth example (bearer)
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    const token = req.get('authorization')?.replace(/^Bearer /i, '');
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'unauthorized', id: res.locals.reqId });
    }
  }
  next();
});

// … routes here …

// 4) 404 (after routes)
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', id: res.locals.reqId });
});

// 5) Central error handler (last)
app.use((err, req, res, _next) => {
  const status = err.status ?? err.statusCode ?? 500;
  const body = {
    error: err.code || 'internal_error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
    id: res.locals.reqId
  };
  if (!res.headersSent) res.status(status).json(body);
});
```

------

## Async handlers: make them safe (Express 4 vs 5)

- **Express 4** doesn’t catch promise rejections by default. Wrap them.
- **Express 5** auto-forwards async errors to the error middleware.

**Wrapper (works everywhere):**

```js
export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Usage:
app.get('/stats', ah(async (req, res) => {
  const stats = await loadStats();
  res.json(stats);
}));
```

------

## Consistent error type (so you can `.throw()` cleanly)

```js
export class HttpError extends Error {
  /** @param {number} status @param {string} code @param {string} message */
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

// throw new HttpError(422, 'invalid_email', 'Email must be a string')
```

**Use in routes**

```js
app.post('/users', ah(async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string') throw new HttpError(422, 'invalid_email', 'Email must be a string');
  const user = await createUser({ email });
  res.status(201).json(user);
}));
```

------

## Avoid double sends (classic interview gotcha)

- Always `return` after `res.json()`/`res.end()` when branching.
- In error middleware, check `res.headersSent` before responding.
- For streams/pipelines, **use `pipeline`** and `catch(next)`.

```js
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

app.get('/download/:name', ah(async (req, res) => {
  res.attachment(req.params.name);
  await pipeline(fs.createReadStream(`files/${req.params.name}`), res); // errors bubble to ah() → next()
}));
```

------

## Route-scoped middleware (only for some routes)

```js
function requireAuth(req, res, next) {
  if (!req.get('authorization')) return res.status(401).json({ error: 'unauthorized', id: res.locals.reqId });
  next();
}

app.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true });
});
```

------

## Graceful client disconnects

Cancel upstream work if the client goes away.

```js
import { setTimeout as sleep } from 'node:timers/promises';

app.get('/report', ah(async (req, res) => {
  const ac = new AbortController();
  const onClose = () => ac.abort(new Error('client_disconnected'));
  res.on('close', onClose);

  try {
    // long job that supports { signal }
    const data = await buildReport({ signal: ac.signal });
    res.json(data);
  } finally {
    res.off('close', onClose);
  }
}));
```

------

## Shaping validation errors (nice DX)

Centralize schema/validation failures into a predictable response.

```js
// Example: transform a Zod/Joi error to { error, details[] }
app.use((err, req, res, next) => {
  if (err.name === 'ZodError') {
    const details = err.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
    return res.status(422).json({ error: 'validation_failed', details, id: res.locals.reqId });
  }
  next(err);
});
```

------

## Security middlewares (quick notes)

- **Helmet**: `npm i helmet`, `app.use(helmet())` → sets security headers.
- **CORS**: `npm i cors`, `app.use(cors({ origin: 'https://your.app', credentials: true }))`.
- **Rate limit**: `npm i express-rate-limit`, protect login/search endpoints.
- **HPP** (HTTP Parameter Pollution): `npm i hpp`, `app.use(hpp())`.

*(Full details live under `cors-rate-limit-helmet.md`.)*

------

## Logging (structured) without extra libs

Already in the baseline stack, but for more features:

- **morgan** for dev (`tiny`, `combined` formats).
- **pino-http** for prod JSON logs (fast, includes req/res automatically).

------

## Per-request context (correlation) without global state

Put shared values on **`res.locals`** (safe per-request) or use `AsyncLocalStorage` for deeper context across async hops.

```js
import { AsyncLocalStorage } from 'node:async_hooks';
export const als = new AsyncLocalStorage();

app.use((req, res, next) => {
  als.run({ reqId: res.locals.reqId }, next);
});

// later in any service fn:
const ctx = als.getStore(); // { reqId }
```

------

## Small production checklist

- ✅ Request ID in/out (`x-request-id`)
- ✅ Body limits set; only parse what you need
- ✅ Central error handler (status, code, id); 404 after routes
- ✅ Async wrapper (or Express 5)
- ✅ Timeouts/cancellation for upstream calls; handle client disconnects
- ✅ Don’t leak internals in prod messages (`NODE_ENV` check)

------

## ✅ Interview Tips

- Explain **order of middleware** and why 404/error go last.
- Show a **wrapper** for async routes and discuss Express 4 vs 5.
- Present a **consistent error shape** (`{ error, message?, id }`) and a custom `HttpError`.
- Mention **client disconnect handling**, **pipeline for streams**, and **res.headersSent**.

------

Next: **validation-zod-joi.md** (schema validation approaches, request DTOs, sanitize/coerce, and practical patterns).