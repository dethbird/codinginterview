**supertest-http-tests.md**

# Supertest HTTP Tests (Express APIs)

## 📌 What & why

**Supertest** lets you call your Express (or Fastify/Koa) app **without opening a port**. You can assert **status, headers, body**, handle **cookies**, **file uploads**, and test **error cases** end-to-end at the HTTP layer—fast enough for CI.

------

## Install & minimal setup

```bash
npm i -D supertest
```

**Export the app (not the server)**

```ts
// src/app.ts
import express from 'express';
export const app = express();
app.use(express.json());
app.get('/health', (_req,res)=>res.json({ ok:true }));
// routes...
```

**Boot server only in prod**

```ts
// src/server.ts
import { app } from './app';
app.listen(process.env.PORT || 3000);
```

------

## Basic test (works with Vitest or Jest)

```ts
// tests/http/health.test.ts
import request from 'supertest';
import { app } from '@/app';

it('GET /health returns ok', async () => {
  const res = await request(app).get('/health').expect(200).expect('content-type', /json/);
  expect(res.body).toEqual({ ok: true });
});
```

**Common Supertest args**

- `.get/.post/.put/.patch/.delete(path)`
- `.query(obj)` → sets `?key=value`
- `.send(body)` → JSON body (sets Content-Type)
- `.set(name, value)` → header
- `.expect(status|fn|header)` → assertions
- `.timeout(ms)` → per-request test timeout

------

## Testing POST + validation

```ts
it('creates user and returns 201', async () => {
  const res = await request(app)
    .post('/users')
    .send({ email: 'a@b.com', name: 'Alice' })
    .expect(201);
  expect(res.body).toMatchObject({ id: expect.any(String), email: 'a@b.com' });
});

it('422 on invalid email', async () => {
  const res = await request(app).post('/users').send({ email: 'nope' }).expect(422);
  expect(res.body).toEqual({ error: 'validation_failed', details: expect.any(Array) });
});
```

------

## Auth patterns

### Bearer JWT

```ts
function auth(token='test.jwt') {
  return request(app).get('/me').set('authorization', `Bearer ${token}`);
}
it('401 without token', async () => {
  await request(app).get('/me').expect(401);
});
it('200 with token', async () => {
  const res = await auth().expect(200);
  expect(res.body).toHaveProperty('id');
});
```

### Cookie session (login → reuse cookie jar)

```ts
it('login sets sid cookie, then access /me', async () => {
  const agent = request.agent(app);          // keeps cookies between calls
  await agent.post('/login').send({ email:'a@b.com', password:'x' }).expect(200);
  const me = await agent.get('/me').expect(200);
  expect(me.body.email).toBe('a@b.com');
});
```

### CSRF (double-submit header)

```ts
it('rejects POST without CSRF', async () => {
  const agent = request.agent(app);
  const csrf = await agent.get('/csrf').expect(200).then(r => r.body.token);
  await agent.post('/change-email').send({ email:'x@y.com' }).expect(403);
  await agent.post('/change-email')
    .set('x-csrf-token', csrf)
    .send({ email:'x@y.com' })
    .expect(200);
});
```

------

## Database hygiene in tests

### Transaction per test (fast)

```ts
import { pool } from '@/db';

beforeEach(async () => { await pool.query('BEGIN'); });
afterEach(async () => { await pool.query('ROLLBACK'); });
```

> Ensure app code in tests uses the **same connection** if you wrap in a txn; otherwise use a separate **test DB** and truncate tables between tests.

### Factories (seed data)

```ts
export async function makeUser(overrides={}) {
  const { rows:[u] } = await pool.query(
    'INSERT INTO users(email,name) VALUES ($1,$2) RETURNING *',
    [overrides.email ?? `u_${crypto.randomUUID()}@test.dev`, overrides.name ?? 'Test']
  );
  return u;
}
```

------

## File uploads & downloads

### Multipart upload

```ts
it('uploads avatar', async () => {
  await request(app)
    .post('/me/avatar')
    .field('title', 'headshot')   // extra fields
    .attach('file', Buffer.from('abc'), { filename: 'a.png', contentType: 'image/png' })
    .expect(201);
});
```

### Streaming download (assert headers + body)

```ts
it('streams CSV', async () => {
  const res = await request(app).get('/export.csv').buffer(true).parse((res, cb) => {
    const chunks: Buffer[] = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => cb(null, Buffer.concat(chunks)));
  }).expect(200).expect('content-type', /text\/csv/);

  expect(res.text.split('\n')[0]).toMatch('id,name');
});
```

------

## Pagination & link headers

```ts
it('paginates with next cursor', async () => {
  const res = await request(app).get('/users?per=20').expect(200);
  expect(res.body.items).toHaveLength(20);
  expect(res.headers).toHaveProperty('x-next-cursor');
});
```

------

## Error handling shape (consistency)

```ts
it('404 returns consistent error body', async () => {
  const res = await request(app).get('/nope').expect(404);
  expect(res.body).toEqual({ error: 'not_found' });
});

it('500 masks internals in prod', async () => {
  process.env.NODE_ENV = 'production';
  const res = await request(app).get('/boom').expect(500);
  expect(res.body).toEqual({ error: 'internal_error' });
});
```

------

## Stubbing external HTTP (don’t hit the internet)

```ts
// npm i -D nock
import nock from 'nock';

it('calls upstream API', async () => {
  nock('https://up.example.com').get('/rates?cc=US').reply(200, { rate: 0.2 });
  const res = await request(app).get('/tax?cc=US').expect(200);
  expect(res.body).toEqual({ rate: 0.2 });
  expect(nock.isDone()).toBe(true);
});
```

------

## Auth helpers (DRY)

```ts
export async function loginAgent(email='a@b.com') {
  const agent = request.agent(app);
  await agent.post('/login').send({ email, password:'pw' }).expect(200);
  return agent;
}
```

------

## Snapshot-ish body checks (stable parts only)

```ts
it('returns order with items', async () => {
  const res = await request(app).get('/orders/o_123').expect(200);
  expect(res.body).toMatchObject({
    id: 'o_123',
    items: expect.arrayContaining([ expect.objectContaining({ sku: expect.any(String) }) ])
  });
});
```

------

## Timeouts & concurrency

```ts
it('respects request timeout', async () => {
  await request(app).get('/slow').timeout({ deadline: 1500 }).expect(503);
});
```

------

## Useful Supertest tricks (cheat sheet)

- `.agent(app)` → persistent cookies across requests.
- `.redirects(n)` → follow redirects up to n hops.
- `.type('form')` → `application/x-www-form-urlencoded`.
- `.unset('Header-Name')` → remove default headers if any.
- `.ok(fn)` → custom success detector.

------

## Full example: protected CRUD flow

```ts
it('creates, reads, and deletes a note', async () => {
  const agent = await loginAgent();
  const created = await agent.post('/notes').send({ title:'T', body:'B' }).expect(201).then(r => r.body);
  await agent.get(`/notes/${created.id}`).expect(200).expect(res => {
    expect(res.body).toMatchObject({ title:'T', body:'B' });
  });
  await agent.delete(`/notes/${created.id}`).expect(204);
  await agent.get(`/notes/${created.id}`).expect(404);
});
```

------

## ✅ Interview Tips

- Explain testing levels: **unit** (pure functions), **HTTP with Supertest** (routes/middleware), **integration** (DB), a few **e2e**.
- Show **agent** for cookie flows, and **nock** for upstreams.
- Mention **transaction-per-test** or **truncate** strategy.
- Assert **status+headers+body**; cover **error shapes** and **edge cases** (uploads, streams, pagination).

------

Next: **mocking-and-test-doubles.md** or want to jump ahead to coverage & thresholds?