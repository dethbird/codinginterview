**postgres-pg.md**

# PostgreSQL with `pg` (node-postgres)

## 📌 What & why

`pg` is the low-level, fast, widely-used PostgreSQL driver for Node. You’ll use it for:

- **Connection pooling**
- **Parameterized queries** (no SQL injection)
- **Transactions** (with retries)
- **Bulk ops & pagination**
- **Streaming big result sets**
- **Type parsing (numeric/int8/timestamp)**

------

## Install & setup

```bash
npm i pg
// db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g. postgres://user:pass@host:5432/db
  max: 10,                    // pool size (match app concurrency)
  idleTimeoutMillis: 30_000,  // close idle clients after 30s
  connectionTimeoutMillis: 5_000 // fail fast if DB is unreachable
});

export { pool };
```

**Tip:** keep `max` modest (e.g., 10–20) to avoid DB thrash. Size by workload & cores.

------

## Parameterized queries (safest default)

```ts
import { pool } from './db';

// $1, $2… are placeholders; pass values array
const { rows } = await pool.query(
  'SELECT id, email FROM users WHERE email = $1',
  ['alice@example.com']
);

// Named prepared statement (DB can reuse plan)
const { rows: r2 } = await pool.query({
  name: 'user-by-email',
  text: 'SELECT id, email FROM users WHERE email = $1',
  values: ['alice@example.com'],
});
```

**Arguments:**

- `text` (string SQL), `values` (any[]), optional `name` for prepared statements, `rowMode: 'array'` (if you want arrays not objects).

------

## Inserts / updates (with RETURNING)

```ts
const { rows: [user] } = await pool.query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name',
  ['a@b.com', 'Alice']
);

await pool.query(
  'UPDATE users SET name = $1 WHERE id = $2',
  ['Alicia', user.id]
);
```

------

## Upsert (ON CONFLICT)

```ts
await pool.query(
  `INSERT INTO users (id, email, name)
   VALUES ($1, $2, $3)
   ON CONFLICT (id) DO UPDATE
     SET email = EXCLUDED.email, name = EXCLUDED.name`,
  [id, email, name]
);
```

------

## Transactions (with helper + retries)

```ts
// tx.ts
import { pool } from './db';

type TxFn<T> = (q: (sql: string, vals?: any[]) => Promise<any>) => Promise<T>;

export async function withTx<T>(fn: TxFn<T>, retries = 2): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const result = await fn((sql, vals=[]) => client.query(sql, vals));
      await client.query('COMMIT');
      return result;
    } catch (e: any) {
      await client.query('ROLLBACK');
      // Retry on serialization/deadlock
      if (retries > 0 && ['40001','40P01'].includes(e.code)) {
        return withTx(fn, retries - 1);
      }
      throw e;
    }
  } finally {
    client.release();
  }
}
```

**Usage:**

```ts
await withTx(async (q) => {
  const { rows: [o] } = await q('INSERT INTO orders(user_id) VALUES ($1) RETURNING id', [userId]);
  await q('INSERT INTO order_items(order_id, sku, qty) VALUES ($1, $2, $3)', [o.id, sku, qty]);
});
```

------

## Pagination (offset vs keyset)

**Offset/limit** (simple, slower on big tables):

```ts
const page = Math.max(1, Number(req.query.page||1));
const per = Math.min(100, Number(req.query.per||20));
const { rows } = await pool.query(
  `SELECT id, name FROM users ORDER BY id DESC OFFSET $1 LIMIT $2`,
  [(page-1)*per, per]
);
```

**Keyset** (faster for deep pages):

```ts
// pass last seen id as ?after=123
const after = Number(req.query.after || 9e18);
const { rows } = await pool.query(
  `SELECT id, name FROM users WHERE id < $1 ORDER BY id DESC LIMIT $2`,
  [after, per]
);
```

------

## Bulk insert (batched)

```ts
type Item = { sku: string; qty: number; };
function bulkInsertItems(orderId: number, items: Item[]) {
  const values: any[] = [];
  const tuples = items.map((it, i) => {
    values.push(orderId, it.sku, it.qty);
    const j = i*3;
    return `($${j+1}, $${j+2}, $${j+3})`;
  }).join(',');
  return pool.query(
    `INSERT INTO order_items(order_id, sku, qty) VALUES ${tuples}`,
    values
  );
}
```

*Or use COPY with `pg-copy-streams` for huge loads.*

------

## Streaming big result sets

For millions of rows, don’t load all into memory. Use `pg-query-stream`.

```bash
npm i pg-query-stream
import { pool } from './db';
import QueryStream from 'pg-query-stream';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

const client = await pool.connect();
try {
  const qs = new QueryStream('SELECT id, email FROM users WHERE active = $1', [true], { batchSize: 1000 });
  const stream = client.query(qs);
  await pipeline(stream, fs.createWriteStream('active-users.jsonl'));
} finally {
  client.release();
}
```

------

## Timeouts & cancellation (practical)

- Prefer **server-side timeouts**:
  - Per-session: `await client.query('SET statement_timeout = 2000')`
  - Per-tx: `await q('SET LOCAL statement_timeout = 2000')` (resets after COMMIT/ROLLBACK)
- Also set Postgres `idle_in_transaction_session_timeout` to avoid zombie txns.
- If you need hard cancellation, issue `SELECT pg_cancel_backend(pid)` from another connection (advanced).

------

## Error handling (map codes to HTTP)

```ts
try {
  await pool.query('INSERT INTO users(email) VALUES ($1)', [email]);
} catch (e: any) {
  if (e.code === '23505') { // unique_violation
    return res.status(409).json({ error: 'email_taken' });
  }
  if (e.code === '23503') { // foreign_key_violation
    return res.status(422).json({ error: 'invalid_fk' });
  }
  throw e;
}
```

------

## Type parsing (numeric/int8/timestamps)

By default, `pg` returns:

- `numeric` as **string** (avoid precision loss)
- `int8/bigint` as **string**
- timestamps as **string** (UTC vs local depends on server settings)

Customize parsers if desired:

```ts
import pg from 'pg';
const { types } = pg;
// OIDs: 1700 numeric, 20 int8/bigint, 1184 timestamptz
types.setTypeParser(20, (v) => Number(v));            // bigints → number (risk overflow >2^53-1)
types.setTypeParser(1700, (v) => Number(v));          // numeric → number (if you know values are small)
types.setTypeParser(1184, (v) => new Date(v));        // timestamptz → Date
```

**Safer**: keep as strings, convert at the edges you control.

------

## Migrations (minimal approach)

Pick a tool (any of: `node-pg-migrate`, `dbmate`, `umzug`+SQL files, or your CI). Bare-bones “SQL files + table” approach:

```sql
-- 001_init.sql
CREATE TABLE _migrations(id text primary key, applied_at timestamptz not null default now());
-- ... real DDL below ...
// migrate.ts (very small runner)
import { pool } from './db';
import fs from 'node:fs';
const files = fs.readdirSync('migrations').sort(); // ['001_init.sql', '002_users.sql', ...]

for (const f of files) {
  const id = f.split('.')[0];
  const { rowCount } = await pool.query('INSERT INTO _migrations(id) VALUES ($1) ON CONFLICT DO NOTHING', [id]);
  if (rowCount) {
    const sql = fs.readFileSync(`migrations/${f}`, 'utf8');
    await pool.query(sql);
    console.log('applied', id);
  }
}
```

------

## Security & perf checklist

- ✅ Always use **parameterized** queries (`$1, $2…`).
- ✅ **Limit pool size**; don’t outnumber DB CPU/IO by 10x.
- ✅ **Short transactions**; set **`statement_timeout`**.
- ✅ **Indexes** for WHERE/ORDER BY; watch `EXPLAIN ANALYZE` in perf issues.
- ✅ Use **keyset pagination** for deep lists.
- ✅ Handle **error codes** (`23505`, `23503`, `40001`, `40P01`) explicitly.
- ✅ Log query duration & rows for slow queries (sampling).

------

## ✅ Interview Tips

- Explain pool vs single client; sizing rationale.
- Show a **transaction helper** with **retry** on serialization/deadlock.
- Demonstrate **upsert** with `ON CONFLICT`.
- Discuss **pagination trade-offs** (offset vs keyset).
- Mention **streaming for big exports** and **type parsing** gotchas.

------

Next: **mysql-mysql2.md** or want to jump to **mongodb-mongoose.md**?