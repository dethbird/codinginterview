**mysql-mysql2.md**

# MySQL with `mysql2`

## 📌 What & why

`mysql2` is the go-to MySQL/MariaDB driver for Node. It’s fast, Promise-friendly, and supports:

- **Connection pooling**
- **Prepared statements** (placeholders) to prevent SQL injection
- **Transactions** and isolation levels
- **Streaming** large result sets
- Type parsing (bigints/decimals/dates)

> Use `mysql2/promise` for async/await ergonomics. Avoid enabling `multipleStatements` (injection risk).

------

## Install & basic pool

```bash
npm i mysql2
// db.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,  // or host/user/password/database
  // host: 'localhost', user: 'app', password: 'secret', database: 'appdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Important defaults:
  charset: 'utf8mb4',            // full Unicode (incl. emoji)
  timezone: 'Z',                  // treat DATETIME as UTC
  namedPlaceholders: true,        // :name syntax (nice DX)
  decimalNumbers: false,          // keep DECIMAL as strings (safer for money)
  dateStrings: ['DATE'],          // return DATE as string; DATETIME still as JS Date
  // ⚠️ Do not turn this on unless you know what you’re doing:
  // multipleStatements: true
});
```

**Why these options**

- `charset: 'utf8mb4'` avoids mojibake.
- `timezone: 'Z'` prevents implicit local-time shifts.
- `decimalNumbers: false` keeps precise decimals as **strings** (convert at the edge).
- `namedPlaceholders: true` enables `:foo` params in queries.

------

## Queries (prepared statements)

```ts
// Positional placeholders
const [rows] = await pool.execute(
  'SELECT id, email FROM users WHERE email = ?',
  ['alice@example.com']
);

// Named placeholders (with namedPlaceholders: true)
const [rows2] = await pool.execute(
  'SELECT id FROM users WHERE created_at >= :since LIMIT :limit',
  { since: new Date('2024-01-01'), limit: 100 }
);
```

**Parameters**

- `.execute(sql, values)` uses **prepared statements** (server-side when possible).
- `.query(sql, values)` may do client-side interpolation; prefer `.execute`.

------

## Inserts/updates with `INSERT ... ON DUPLICATE KEY UPDATE`

```ts
const [res] = await pool.execute(
  `INSERT INTO users (id, email, name)
   VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name)`,
  [id, email, name]
);
// res.affectedRows: 1 (insert) or 2 (update path)
```

------

## Transactions (with helper + retries)

```ts
export async function withTx<T>(fn: (conn: mysql.PoolConnection) => Promise<T>, retries = 2): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (e: any) {
      await conn.rollback();
      // Deadlock (1213) or lock wait timeout (1205) → retry
      if (retries > 0 && (e?.errno === 1213 || e?.errno === 1205)) {
        return withTx(fn, retries - 1);
      }
      throw e;
    }
  } finally {
    conn.release();
  }
}

// Usage:
await withTx(async (conn) => {
  const [[{ cnt }]] = await conn.execute('SELECT COUNT(*) AS cnt FROM inventory WHERE sku = ?', [sku]) as any;
  if (cnt === 0) throw new Error('missing_sku');
  await conn.execute('UPDATE inventory SET qty = qty - ? WHERE sku = ?', [1, sku]);
  await conn.execute('INSERT INTO orders(user_id, sku) VALUES (?, ?)', [userId, sku]);
});
```

**Notes**

- Set isolation if needed: `await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED')`.
- Keep transactions **short**; avoid long-running reads/writes.

------

## Bulk operations

### Multi-row insert (fast)

```ts
type Row = [string, number]; // [sku, qty]
const rows: Row[] = items.map(i => [i.sku, i.qty]);
await pool.query('INSERT INTO order_items (sku, qty) VALUES ?', [rows]);
// mysql2 expands VALUES ? → (..), (..), ...
```

### Keyset pagination (deep pages that stay fast)

```ts
// ?after=last_id_you_saw
const after = Number(req.query.after || 9e18);
const per = Math.min(100, Number(req.query.per || 20));
const [rows] = await pool.execute(
  'SELECT id, name FROM users WHERE id < ? ORDER BY id DESC LIMIT ?',
  [after, per]
);
```

------

## Streaming large result sets

```ts
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';
import mysql from 'mysql2';

const conn = mysql.createConnection(process.env.DATABASE_URL);
const stream = conn.query('SELECT * FROM big_table WHERE active = 1').stream({ highWaterMark: 1000 });
await pipeline(stream, fs.createWriteStream('big.jsonl'));
conn.end();
```

**Tip:** For Promise API, create a non-promise connection for streaming, or use `pool.getConnection()` and `connection.queryStream()`.

------

## Timeouts & cancellation

```ts
// Connection-level
const pool = mysql.createPool({ /*...*/, connectTimeout: 5000 });

// Per-query timeout:
await pool.execute({ sql: 'SELECT SLEEP(10)', timeout: 2000 } as any).catch(e => {
  // e.code === 'PROTOCOL_SEQUENCE_TIMEOUT'
});
```

If a query is truly wedged, you can `conn.destroy()` (tears down the socket). Prefer **server-side** timeouts too: `SET SESSION max_execution_time=2000` (Percona/MySQL 8+ variants) where available.

------

## Common error codes (map to HTTP)

- `ER_DUP_ENTRY` **1062** → 409 Conflict (unique key)
- `ER_NO_REFERENCED_ROW_2` **1452** → 422 (FK violation)
- `ER_LOCK_DEADLOCK` **1213** → retry transaction
- `ER_LOCK_WAIT_TIMEOUT` **1205** → retry or 503
- `PROTOCOL_CONNECTION_LOST` → DB restarted / network hiccup (auto-retry safe reads)

Example:

```ts
try {
  await pool.execute('INSERT INTO users(email) VALUES (?)', [email]);
} catch (e: any) {
  if (e?.errno === 1062) return res.status(409).json({ error: 'email_taken' });
  throw e;
}
```

------

## Type parsing & date handling

- **BIGINT/DECIMAL**: by default returned as **strings** (keep them as strings for money/ids).

- **Dates**:

  - `timezone: 'Z'` returns `DATETIME` as local Date *interpreted as UTC*. Consider storing all timestamps as `TIMESTAMP` UTC and reading via `timezone:'Z'`, or return everything as **strings** with `dateStrings: true` and parse explicitly.

- If you must coerce numbers:

  ```ts
  const cents = Number(row.amount_cents); // safe small integers only
  ```

------

## Migrations (bare-bones)

Use any tool you like (dbmate, knex, umzug). Minimal SQL-file runner sketch:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db';

export async function migrate(dir = 'migrations') {
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations(id VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  const files = (await fs.readdir(dir)).sort();
  for (const f of files) {
    const id = f.split('.')[0];
    const [rows] = await pool.execute('SELECT 1 FROM _migrations WHERE id = ?', [id]);
    if ((rows as any[]).length) continue;
    const sql = await fs.readFile(path.join(dir, f), 'utf8');
    await withTx(async (conn) => { await conn.query(sql); await conn.execute('INSERT INTO _migrations(id) VALUES (?)', [id]); });
    console.log('applied', id);
  }
}
```

------

## Security & perf checklist

- ✅ Use **placeholders** (`?` or `:name`) — never string-concat values.
- ✅ Keep `multipleStatements: false` (default).
- ✅ Pool size **10–20** per app instance; measure before raising.
- ✅ Short transactions; add **retries** on 1213/1205.
- ✅ Use **keyset pagination** for deep pages.
- ✅ Enforce server-side **query timeouts** and app-side per-query `timeout`.
- ✅ Set `charset:'utf8mb4'`, decide date/decimal strategy up front.

------

## ✅ Interview Tips

- Explain `.execute` vs `.query` and why prepared statements matter.
- Show a **transaction helper** with deadlock retries.
- Discuss **timezone/decimal** handling strategies.
- Demonstrate **bulk insert** and **keyset pagination**.
- Mention **streaming** big reads and **per-query timeouts**.

------

Next: **mongodb-mongoose.md** (MongoDB driver vs Mongoose, schemas/models, indexing, transactions on replica sets, and pagination).