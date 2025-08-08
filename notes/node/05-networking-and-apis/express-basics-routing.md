**express-basics-routing.md**

# Express Basics & Routing

## 📌 What & why

**Express** is the de-facto minimalist HTTP framework for Node. It gives you:

- Declarative **routing** for methods/paths
- **Middleware** pipeline (`req` → `res` → `next`) for cross-cutting concerns
- Handy response helpers (`res.json`, `res.status`, `res.set`)
- Easy integration with validation, auth, logging, file uploads, etc.

Use Express when you want productivity and a huge ecosystem without hiding Node’s streaming primitives.

------

## Install & bootstrap

```bash
npm i express
```

**ESM**

```js
// server.mjs
import express from 'express';

const app = express();
app.use(express.json()); // built-in JSON body parser

app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.listen(process.env.PORT || 3000, () => {
  console.log('API on', process.env.PORT || 3000);
});
```

**CommonJS**

```js
// server.js
const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(3000);
```

------

## Routing essentials

### Route methods & params

```js
app.get('/users/:id', (req, res) => {
  const id = req.params.id;              // path param
  const include = req.query.include;     // ?include=orders
  res.json({ id, include });
});
```

### Multiple handlers (middleware chain)

```js
function requireAuth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.post('/users', requireAuth, (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string') return res.status(422).json({ error: 'invalid_email' });
  res.status(201).json({ id: 123, email });
});
```

### Routers (modular routes)

```js
import { Router } from 'express';
const users = Router();

users.get('/', listUsers);              // GET /users
users.get('/:id', getUserById);        // GET /users/:id
users.post('/', createUser);

app.use('/users', users);              // mount router
```

### Route patterns & ordering

- Express matches top-to-bottom. **Order matters.**
- More specific routes before catch-alls:

```js
app.get('/files/:name', getFile);
app.get('/files/*', notFound); // after, or it will swallow :name
```

------

## Middleware anatomy & types

### Standard middleware

```js
// (req, res, next) -> void|Promise
app.use((req, _res, next) => {
  req.start = Date.now();
  next();
});
```

### Error-handling middleware

```js
// (err, req, res, next) -> void
app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;          // avoid double-send
  res.status(500).json({ error: 'internal_error' });
});
```

### 404 handler

```js
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
```

------

## Async handlers & errors

- **Express 4**: unhandled promise rejections in route handlers **do not** hit the error middleware. Use a wrapper.
- **Express 5+**: `async` handlers propagate to error middleware automatically.

**Works everywhere (wrapper)**

```js
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/stats', ah(async (_req, res) => {
  const stats = await loadStats();
  res.json(stats);
}));
```

------

## Request parsing & limits

### JSON & URL-encoded

```js
app.use(express.json({ limit: '256kb' }));                 // body size cap
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
```

### Raw bodies (for signature verification)

```js
app.use('/webhooks/stripe', express.raw({ type: '*/*', limit: '1mb' }), verifyStripeSig, handler);
```

------

## Headers, status, caching helpers

```js
app.get('/etag-example', (req, res) => {
  const body = JSON.stringify({ now: Date.now() });
  const etag = `"${require('crypto').createHash('sha1').update(body).digest('hex')}"`;

  if (req.header('if-none-match') === etag) return res.status(304).set('etag', etag).end();
  res.status(200).set('etag', etag).type('json').send(body);
});
```

------

## Streaming with Express (keep Node power)

### Stream a file with `pipeline`

```js
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

app.get('/download/:name', async (req, res, next) => {
  try {
    const name = req.params.name.replace(/[^-\w.]/g, ''); // basic sanitize
    res.attachment(name);                                 // sets Content-Disposition
    await pipeline(fs.createReadStream(`files/${name}`), res);
  } catch (e) { next(e); }
});
```

### Proxy/pipe upstream response

```js
import fetch from 'node-fetch';
import { pipeline } from 'node:stream/promises';

app.get('/proxy', async (req, res, next) => {
  try {
    const upstream = await fetch('https://example.com/bigfile');
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => res.setHeader(k, v));
    await pipeline(upstream.body, res);
  } catch (e) { next(e); }
});
```

------

## Response helpers you’ll actually use

```js
res.status(201).json({ id: 1 });   // set status + JSON
res.type('application/json');      // or .type('json')
res.set('x-request-id', 'abc');    // set header
res.location('/users/1');          // sets Location header
res.redirect(302, '/login');       // redirect
```

------

## Trust proxy & real client IP (behind load balancers)

```js
app.set('trust proxy', true); // or a subnet string like 'loopback' or '10.0.0.0/8'
app.use((req, _res, next) => {
  // Now req.ip is from X-Forwarded-For
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  next();
});
```

------

## Small production checklist (Express-focused)

- **Set body size limits** (`express.json({ limit })`).

- Add **404** and **error** middleware (last).

- Use an **async wrapper** (or Express 5) to funnel errors.

- **Validate** inputs (zod/joi) before hitting DB/services.

- **Set timeouts** on upstream calls and **handle client disconnects**:

  ```js
  req.on('close', () => controller.abort()); // if using AbortController upstream
  ```

- Behind proxies/CDNs, **`app.set('trust proxy', true)`** to get real `req.ip`.

------

## Realistic route module template (pasteable)

```js
// routes/users.js
import { Router } from 'express';
export const users = Router();

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

users.get('/', ah(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const perPage = Math.min(100, Number(req.query.perPage || 20));
  const data = await listUsers({ page, perPage });
  res.json(data);
}));

users.get('/:id', ah(async (req, res) => {
  const u = await getUser(req.params.id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  res.json(u);
}));

users.post('/', ah(async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string') return res.status(422).json({ error: 'invalid_email' });
  const created = await createUser({ email });
  res.status(201).json(created);
}));
```

And mount it:

```js
// server.mjs
import express from 'express';
import { users } from './routes/users.js';
const app = express();
app.use(express.json());
app.use('/users', users);
app.use((_req, res) => res.status(404).json({ error: 'not_found' })); // 404 last
app.use((err, _req, res, _next) => res.status(500).json({ error: 'internal_error' })); // error last
app.listen(3000);
```

------

## ✅ Interview Tips

- Explain **middleware order** and the **(err, req, res, next)** signature.
- Show how you **handle async errors** (wrapper or Express 5 behavior).
- Mention **streaming** in Express (still Node streams under the hood).
- Call out **trust proxy**, **body limits**, and **404/error** handlers as must-haves.

------

Next up: **middleware-and-error-handling.md** (deeper dive: global vs route middleware, structured logging, request IDs, centralized error shape, and avoiding double responses).