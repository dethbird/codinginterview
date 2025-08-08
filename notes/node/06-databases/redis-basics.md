**redis-basics.md**

# Redis Basics (cache, rate limits, locks, queues, pub/sub)

## 📌 What & why

**Redis** is an in-memory data store used for **caching**, **rate limiting**, **distributed locks**, **job queues**, **pub/sub**, and **ephemeral state**. It’s extremely fast, but data may be evicted if memory is constrained—use TTLs and treat it as **non-authoritative** unless configured for durability.

------

## Install & connect (node-redis v4)

```bash
npm i redis
// redis.ts
import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL // e.g., redis://:pass@host:6379/0
  // socket: { reconnectStrategy: (retries) => Math.min(50, retries) * 100 }
});
redis.on('error', (e) => console.error('redis error', e));
await redis.connect();
```

**Notes**

- One client handles plenty of ops; create separate clients for **pub** and **sub**.
- Use DB numbers (`.../0`, `.../1`) only for isolation in dev; in prod prefer **key prefixes**.

------

## Core commands you’ll actually use

### GET / SET (with TTL & conditions)

```js
await redis.set('user:123', JSON.stringify(user), { EX: 60 });  // TTL 60s
const s = await redis.get('user:123');                           // string|null
await redis.set('lock:job', '1', { NX: true, PX: 5000 });        // set if not exists, 5s ttl
```

**Options (SET):**

- `EX` seconds or `PX` ms (expiry), `NX` (only if not exists), `XX` (only if exists), `KEEPTTL`, `GET` (return old value).

### Hashes (structured values)

```js
await redis.hSet('sess:abc', { userId: 'u1', role: 'admin' });
const sess = await redis.hGetAll('sess:abc'); // { userId:'u1', role:'admin' }
```

### Counters

```js
await redis.incrBy('counter:signups', 1);
await redis.expire('counter:signups', 86400); // set TTL if new
```

### Sets / Sorted sets (membership & ranking)

```js
await redis.sAdd('alerts:ack', 'u1');
const isAck = await redis.sIsMember('alerts:ack', 'u1'); // boolean

await redis.zAdd('leaderboard', [{ score: 1337, value: 'u1' }]);
const top = await redis.zRangeWithScores('leaderboard', -10, -1);
```

### SCAN (never KEYS in prod)

```js
for await (const key of redis.scanIterator({ MATCH: 'cache:users:*', COUNT: 500 })) {
  await redis.del(key);
}
```

------

## Cache-aside pattern (most common)

```js
async function getUserCached(id) {
  const key = `cache:user:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);            // authoritative source
  if (!user) return null;
  await redis.set(key, JSON.stringify(user), { EX: 300 });
  return user;
}
```

**Invalidation**

- After **update/delete**: `await redis.del(`cache:user:${id}`)`.
- Prefer **short TTLs** + **eventual invalidation** over complex fan-out deletes.

------

## Per-route HTTP caching (Express)

```js
app.get('/products/:id', async (req, res) => {
  const key = `cache:product:${req.params.id}`;
  const cached = await redis.get(key);
  if (cached) return res.set('x-cache', 'hit').type('json').send(cached);

  const data = await fetchProduct(req.params.id);
  const body = JSON.stringify(data);
  await redis.set(key, body, { EX: 120, NX: true }); // stampede-friendly
  res.set('x-cache', 'miss').type('json').send(body);
});
```

------

## Basic rate limiting (INCR + EXPIRE)

```js
// 100 requests per IP per 15 min
async function isRateLimited(ip) {
  const key = `rl:ip:${ip}:${Math.floor(Date.now()/ (15*60*1000))}`; // time bucket
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 15*60);
  return n > 100;
}
```

*Use a rolling window or Redis scripts for smoother limits. For multi-node apps, Redis centralizes counters.*

------

## Distributed lock (SET NX PX) — keep it simple

```js
async function withLock(key, ms, work) {
  const token = crypto.randomUUID();
  const ok = await redis.set(`lock:${key}`, token, { NX: true, PX: ms });
  if (!ok) throw new Error('locked');

  try { return await work(); }
  finally {
    // Lua pattern to "check-and-del" atomically
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else return 0 end`;
    await redis.eval(script, { keys: [`lock:${key}`], arguments: [token] });
  }
}
```

*Good for “only one worker runs this task.” For cross-DC safety, read about **Redlock**.*

------

## Queues: quick options

### Simple queue with LIST (at-least-once)

```js
await redis.lPush('q:emails', JSON.stringify({ to, subject }));
const job = await redis.brPop('q:emails', 5); // blocking pop (value, or null after 5s)
```

*Implement retry + dead-letter list yourself.*

### Durable jobs with **BullMQ** (recommended)

```bash
npm i bullmq
import { Queue, Worker } from 'bullmq';
const queue = new Queue('emails', { connection: { url: process.env.REDIS_URL } });

await queue.add('send', { to, subject }, { attempts: 5, backoff: { type: 'exponential', delay: 5000 } });

new Worker('emails', async (job) => {
  await sendEmail(job.data);
}, { connection: { url: process.env.REDIS_URL }, concurrency: 10 });
```

*Gives retries, backoff, concurrency, delayed jobs, and dashboards.*

------

## Pub/Sub (config invalidation, broadcasts)

```js
const sub = redis.duplicate(); await sub.connect();
await sub.subscribe('cfg:invalidate', (payload) => {
  const { key } = JSON.parse(payload);
  // e.g., clear in-process cache, refresh configs, etc.
});
await redis.publish('cfg:invalidate', JSON.stringify({ key: 'featureFlags' }));
```

*Fire-and-forget notifications; messages are not stored (use **Streams** if you need durability).*

------

## Streams (durable event log, fan-out consumers)

```js
// producer
await redis.xAdd('events:orders', '*', { type: 'created', id: 'o_123' });

// consumer group
await redis.xGroupCreate('events:orders', 'g1', '0', { MKSTREAM: true }).catch(()=>{});
const msgs = await redis.xReadGroup('g1', 'c1', [{ key: 'events:orders', id: '>' }], { COUNT: 10, BLOCK: 5000 });
for (const m of msgs?.[0]?.messages || []) {
  // process m.message
  await redis.xAck('events:orders', 'g1', m.id);
}
```

*Streams keep messages until trimmed; consumer groups track delivery—great for event-driven workflows.*

------

## Transactions & pipelines

```js
// MULTI/EXEC (transactional)
const tx = redis.multi();
tx.set('a','1'); tx.incr('b'); tx.expire('a', 60);
const results = await tx.exec(); // array of replies

// Pipeline (batch, not atomic)
const p = redis.pipeline();
for (let i=0;i<100;i++) p.set(`k:${i}`, String(i), { EX: 60 });
await p.exec();
```

*Use pipelines to reduce RTTs; use transactions only when operations must be atomic together.*

------

## Observability & ops

- **Key design**: prefix by domain (`cache:user:`, `rl:ip:`). Avoid wildcards in hot paths.
- **Eviction policy**: set in Redis (`allkeys-lru`/`volatile-ttl` etc.). Always use TTLs on caches.
- **Monitoring**: track hits/misses, latency, memory, evictions. Sample logs on timeouts.
- **Never** use `KEYS *` in prod; use `SCAN` iterators.

------

## ✅ Interview Tips

- Explain **cache-aside** and why you add **TTLs** + **invalidation** on writes.
- Show **INCR + EXPIRE** rate limiting and why Redis centralizes it across app instances.
- Discuss **SET NX PX** locks and atomic unlock via Lua.
- Contrast **LIST** vs **BullMQ** vs **Streams** for queueing needs.
- Mention **SCAN over KEYS**, key namespacing, and eviction implications.