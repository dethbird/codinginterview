**transactions-and-pooling.md**

# Transactions & Pooling

## 📌 What & why

**Transactions** group several statements into an **all-or-nothing** unit (ACID). They protect invariants (e.g., “decrement inventory and create order together”).
 **Pooling** reuses DB connections so each request doesn’t pay a TCP/TLS/login cost. Correct pool sizing avoids both **exhaustion** (errors/timeouts) and **thrash** (too many connections, DB slowdowns).

------

## Concepts you’ll be asked to define (crisp)

- **ACID**: Atomicity, Consistency, Isolation, Durability.
- **Isolation levels** (common):
  - `READ COMMITTED` (PG default): each statement sees committed rows; avoids dirty reads.
  - `REPEATABLE READ` (MySQL default): snapshot at first read; avoids non-repeatable reads.
  - `SERIALIZABLE`: behaves like a serial order of txns; may abort with serialization errors → **retry**.
- **Deadlock**: two txns wait on each other → DB aborts one. Treat as **retryable**.
- **Long transactions**: hold locks, increase bloat, block DDL. Keep them **short**.
- **Idempotency**: if you **retry**, ensure the effect isn’t duplicated (unique keys, idempotency keys, UPSERT).

------

## Pooling (Node specifics)

### PostgreSQL (`pg`)

```ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                         // concurrent DB conns this process holds
  idleTimeoutMillis: 30_000,       // close idle clients
  connectionTimeoutMillis: 5_000   // wait for a free conn before failing
});
```

**Notes**

- Size `max` to your **concurrency** and DB capacity (often 10–20 per app instance).
- Use **one Pool singleton** per process. For streaming/long ops, `const client = await pool.connect()` and **always** `client.release()`.
- Serverless? Use a **proxy** (e.g., PgBouncer/RDS Proxy) or a serverless driver to avoid connection storms.

### MySQL (`mysql2/promise`)

```ts
import mysql from 'mysql2/promise';
export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,                   // 0 = unlimited queue (usually fine)
  // optional timeouts:
  connectTimeout: 5_000
});
```

**Notes**

- Same singleton rule. Avoid per-request `createConnection()`.
- MySQL happily accepts many connections… until it doesn’t. Keep limits sane (10–30 per instance).

------

## Transactions (helpers you can paste)

### PostgreSQL helper with **retry** (serialization/deadlock)

```ts
import { pool } from './db';

type Tx<T> = (q: (sql: string, vals?: any[]) => Promise<any>) => Promise<T>;

export async function withPgTx<T>(fn: Tx<T>, retries = 2): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const result = await fn((sql, vals=[]) => client.query(sql, vals));
      await client.query('COMMIT');
      return result;
    } catch (e: any) {
      await client.query('ROLLBACK');
      if (retries > 0 && ['40001','40P01'].includes(e.code)) {
        return withPgTx(fn, retries - 1); // retryable
      }
      throw e;
    }
  } finally {
    client.release();
  }
}
```

**Arguments that matter**

- `retries`: how many times to retry on `40001` (serialization) or `40P01` (deadlock).
- Inside, use the provided `q(sql, vals)` to ensure statements run on the **same connection**.

**Per-transaction timeouts (PG)**

```ts
await q('SET LOCAL statement_timeout = 2000'); // ms; resets after COMMIT/ROLLBACK
```

### MySQL helper with **retry** (deadlock/lock wait timeout)

```ts
import { pool } from './db-mysql';
import type { PoolConnection } from 'mysql2/promise';

export async function withMyTx<T>(fn: (conn: PoolConnection)=>Promise<T>, retries = 2): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      const out = await fn(conn);
      await conn.commit();
      return out;
    } catch (e: any) {
      await conn.rollback();
      if (retries > 0 && (e?.errno === 1213 || e?.errno === 1205)) {
        return withMyTx(fn, retries - 1);
      }
      throw e;
    }
  } finally {
    conn.release();
  }
}
```

**Isolation level (optional)**

```ts
await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'); // before first statement
```

------

## Choosing an isolation level (sound bites + when)

- **READ COMMITTED (PG)**: web apps, short txns, avoids stale reads. Use for most CRUD.
- **REPEATABLE READ (MySQL default)**: consistent snapshot; good for multi-read logic within a txn.
- **SERIALIZABLE**: financial correctness when subtle write skew could happen. Expect **retries**.
- **READ ONLY** transactions can be faster/safe: `SET TRANSACTION READ ONLY`.

------

## Practical patterns you’ll actually use

### 1) Reserve inventory (race-safe)

```ts
await withPgTx(async (q) => {
  const { rows: [sku] } = await q('SELECT qty FROM inventory WHERE id=$1 FOR UPDATE', [id]);
  if (!sku || sku.qty < 1) throw new Error('out_of_stock');
  await q('UPDATE inventory SET qty = qty - 1 WHERE id=$1', [id]);
  await q('INSERT INTO orders(user_id, sku_id) VALUES ($1,$2)', [userId, id]);
});
```

*`FOR UPDATE` locks the row so two buyers can’t both decrement below zero.*

### 2) Idempotent order creation (retry-safe)

- Add a unique key: `UNIQUE (user_id, idempotency_key)`.

```ts
await withMyTx(async (conn) => {
  await conn.execute(
    'INSERT INTO orders(user_id, key, total) VALUES (?,?,?)',
    [userId, key, total]
  ); // duplicate key on retry → harmless
});
```

### 3) Read → compute → write (avoid stale reads)

- In PG, add a **WHERE** with the version or updated_at to protect against **lost updates**:

```ts
await withPgTx(async (q) => {
  const { rows: [row] } = await q('SELECT id, version FROM docs WHERE id=$1', [id]);
  const ok = await q('UPDATE docs SET body=$2, version=version+1 WHERE id=$1 AND version=$3',
                     [id, newBody, row.version]);
  if (ok.rowCount === 0) throw new Error('conflict'); // client must retry with latest
});
```

### 4) Statement timeouts & cancellation

- Prefer **server-side** timeouts (`SET LOCAL statement_timeout` in PG, `max_execution_time` or per-query `timeout` in MySQL2) to avoid hung txns.
- On client disconnects, **abort long work** and let the DB rollback on connection close.

------

## Pool sizing & timeouts (rules of thumb)

- Start with **10–20** connections per app instance. Increase only if:
  - DB CPU is **not saturated**
  - Queries are **mostly I/O-bound**
- Use **connection timeout** (how long to wait for a free pooled connection) to fail fast during traffic spikes.
- **Per-statement** timeout inside txns to avoid “idle in transaction” horror.
- Watch DB **max connections**; app instances × pool size must fit with headroom.

------

## PG Bouncer / proxies (when & gotchas)

- **Session pooling** (default): each client gets a session; all features OK.
- **Transaction pooling**: connections are swapped between txns → **no session state**. Avoid session features: session temp tables, prepared statements, `LISTEN/NOTIFY`. Prisma/pg configs may need tweaks.
- Use proxies in serverless or many pods to avoid connection storms.

------

## Error mapping (surface good HTTP)

- **Postgres**
  - `23505` unique_violation → `409 Conflict`
  - `23503` foreign_key_violation → `422 Unprocessable`
  - `40001`/`40P01` → retry (maybe `503` after retries)
- **MySQL**
  - `1062` duplicate → `409`
  - `1452` foreign key → `422`
  - `1213`/`1205` → retry or `503`

------

## Monitoring & debugging

- Log per-query **duration** and **rows** (sample slow ones).
- Track pool metrics: **total**, **idle**, **waiting**.
- Alert on:
  - long-running transactions
  - `idle in transaction` > N seconds
  - rising deadlocks/serialization failures (tune hotspots, add indexes)
- Use `EXPLAIN (ANALYZE, BUFFERS)` for slow PG queries; `EXPLAIN FORMAT=JSON` in MySQL.

------

## Common pitfalls (and fixes)

- **Forgetting `client.release()`** → pool exhaustion. *Use `try/finally`.*
- **Long txns doing external calls** → locks held too long. *Do I/O **outside** the txn.*
- **Immediate NOT NULL + default on big tables** → table rewrite. *Use phased migration (add nullable → backfill → default → not null).*
- **Retrying non-idempotent ops** → duplicates. *Use unique keys / UPSERT / idempotency keys.*
- **Too-big pools** → DB context switches, worse perf. *Measure before increasing.*

------

## ✅ Interview Tips

- Define **isolation levels** and when you’d use each; mention **retries** for SERIALIZABLE/deadlocks.
- Show a **transaction helper** that keeps work on one connection and **retries** specific error codes.
- Explain **pool sizing** rationale and the symptoms of **leaks** (waiting clients, timeouts).
- Mention **statement timeouts** and **`FOR UPDATE`** for correctness under concurrency.
- Call out **idempotency** patterns (unique keys, UPSERT) to make retries safe.

------

Next: **07-auth-and-security/password-hashing.md**?