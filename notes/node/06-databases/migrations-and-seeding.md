**migrations-and-seeding.md**

# Migrations & Seeding

## 📌 What & why

**Migrations** version your database schema (DDL) so every environment can be moved **forward** (and sometimes backward) deterministically.
 **Seeding** inserts **baseline or sample data** (users, roles, feature flags) for dev/test—or minimal “reference” rows in prod.

------

## Core concepts (you’ll be asked about)

- **Versioned files**: `001_init.sql`, `002_add_users_table.sql` — recorded in a **migrations table** so each runs once.
- **Idempotency**: re-running a migration should not break (use guards or rely on the migrations table).
- **Transactional DDL**: Postgres can wrap most DDL in a tx; MySQL/MariaDB often cannot (long locks, online DDL differences).
- **Zero-downtime**: avoid table locks and **breaking changes** while the app is live (deploy in steps, use backfills and dual reads/writes).

------

## Tooling (pick one, know two)

- **Prisma Migrate**: schema-first, generates SQL, great DX.
- **Knex Migrations**: code-first builder + SQL; very popular.
- **dbmate / dbmate-like**: simple SQL migrations with a `_migrations` table.
- Also: Flyway, Liquibase (enterprise-y). For interviews, being fluent with **Prisma & Knex** is enough.

------

## Prisma Migrate (commands & params you’ll use)

```bash
# Initialize
npx prisma init

# Develop schema iteratively (creates a new migration & applies)
npx prisma migrate dev --name add_users

# Apply existing migrations in CI/prod (no prompts)
npx prisma migrate deploy

# Reset dev DB (drops & re-runs)
npx prisma migrate reset
```

**Seeding hook**

```bash
# package.json
"prisma": { "seed": "node prisma/seed.js" }

# run with
npx prisma db seed
```

**Seed example (idempotent)**

```js
// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.role.upsert({
  where: { name: 'admin' },
  update: {},
  create: { name: 'admin' }
});

await prisma.user.upsert({
  where: { email: 'admin@example.com' },
  update: {},
  create: { email: 'admin@example.com', name: 'Admin', active: true }
});

await prisma.$disconnect();
```

------

## Knex Migrations (API surface you need)

```bash
npx knex init
npx knex migrate:make add_users
npx knex migrate:latest   # apply
npx knex migrate:rollback # revert last batch
```

**Migration file (up/down)**

```js
// migrations/20240201_add_users.js
export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('email').notNullable().unique();
    t.text('name');
    t.boolean('active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}
export async function down(knex) {
  await knex.schema.dropTable('users');
}
```

**Seed files**

```bash
npx knex seed:make seed_basics
npx knex seed:run
// seeds/01_seed_basics.js
export async function seed(knex) {
  await knex('roles').insert([{ name: 'admin' }]).onConflict('name').ignore();
}
```

------

## Safe migration patterns (zero-downtime friendly)

### 1) Add a column with a default (Postgres)

Avoid rewriting the whole table on large relations:

```sql
-- Step 1: add nullable column
ALTER TABLE users ADD COLUMN timezone text;

-- Step 2: backfill in controlled batches (app/service job)
UPDATE users SET timezone='UTC' WHERE timezone IS NULL;

-- Step 3: add default for future rows (fast)
ALTER TABLE users ALTER COLUMN timezone SET DEFAULT 'UTC';

-- Step 4: enforce NOT NULL (after backfill)
ALTER TABLE users ALTER COLUMN timezone SET NOT NULL;
```

### 2) Create index without blocking writes (Postgres)

```sql
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
```

> In Prisma/Knex, drop to raw SQL for `CONCURRENTLY`. In MySQL, prefer **online DDL** (`ALGORITHM=INPLACE`, `LOCK=NONE`) when available.

### 3) Rename / repoint columns (compat deploy)

- **Phase A**: add `new_col`, write to **both** (`old_col` + `new_col`).
- **Phase B**: release app reading `new_col`, still writing both.
- **Phase C**: backfill `new_col` from `old_col` (one-off job).
- **Phase D**: stop writing `old_col`, remove after a grace window.

### 4) Drop columns/tables (last step)

- Ensure **no code** reads them.
- Remove in a later deploy to be safe (and small PRs).

### 5) Large data moves (ETL style)

- Backfill with **batches** (e.g., `LIMIT 10k` loops).
- Throttle to avoid IO spikes; log progress & resumability.
- Wrap each batch in a **small transaction** (not one giant TX).

------

## Data migrations (application-level scripts)

**Pattern: app-controlled backfill runner**

```ts
import { pool } from './db'; // pg or mysql2 pool

export async function backfillUserTimezones(batch = 5000) {
  while (true) {
    const { rows } = await pool.query(
      `UPDATE users
       SET timezone = 'UTC'
       WHERE id IN (
         SELECT id FROM users WHERE timezone IS NULL LIMIT $1
       )
       RETURNING id`, [batch]
    );
    if (rows.length === 0) break;
    await new Promise(r => setTimeout(r, 50)); // gentle throttle
  }
}
```

*Make it **idempotent** and **resumable**. Run in a job runner (BullMQ) or one-off script.*

------

## Seeding strategies (dev/test vs prod)

- **Dev/Test seeds**: fixtures, factories, and helpful accounts.
  - Prefer **idempotent** inserts (UPSERT / `ON CONFLICT DO NOTHING`).
  - Isolate into separate scripts so prod never pulls sample data.
- **Prod seeds**: only **reference data** (roles, feature flags defaults).
  - Treat them like **migrations**: versioned, reviewed, idempotent.
  - For big catalogs, import from a controlled CSV/JSON with checksums.

**Factory example (tests with Jest/Vitest)**

```ts
export async function makeUser(overrides={}) {
  const user = { email: `u_${crypto.randomUUID()}@test.dev`, name: 'Test', active: true, ...overrides };
  const { rows: [u] } = await pool.query(
    `INSERT INTO users(email, name, active) VALUES ($1,$2,$3) RETURNING *`,
    [user.email, user.name, user.active]
  );
  return u;
}
```

------

## CI/CD & deployment flow (real world)

1. **Build** app; run **unit tests**.
2. **Apply migrations** to a testing DB; run **integration tests**.
3. **Deploy** to prod **but**:
   - If using blue/green or canary, **run migrations first** (schema must be ready for both old & new code).
   - Prefer **backward-compatible** migrations (no immediate NOT NULL on new columns).
4. **Run data backfills** asynchronously (queue workers).
5. When safe, **tighten constraints** (NOT NULL, drop old columns).

**Prisma in CI**

```bash
npx prisma migrate deploy
node prisma/seed.js # if you seed prod-reference data
```

**Knex in CI**

```bash
npx knex migrate:latest
NODE_ENV=production node scripts/seed.js  # if applicable
```

------

## Rollbacks & recovery

- Prefer **forward-only** migrations plus **fix-forward** (new migration to revert the effect).
- If you must rollback:
  - Keep **`down`** functions correct and **fast** (no long locks).
  - Snapshot/backup before risky DDL (cloud providers often support point-in-time recovery).
- For failed deploys: **re-run** migration step; tools are idempotent as they record applied versions.

------

## Common pitfalls (how to avoid)

- **Blocking ALTER** on hot tables → use **CONCURRENTLY/online DDL**, or phased changes.
- **Setting NOT NULL with default immediately** on huge tables → split into add → backfill → default → not null.
- **One giant transaction** for a data move → break into **batches**.
- **Seeding prod with dev fixtures** → separate scripts; make seeds conditional on env.
- **Per-request migration checks** → never; run at boot/CI, not during traffic.

------

## ✅ Interview Tips

- Walk through a **zero-downtime column add** (add nullable → backfill → default → not null).
- Explain **index concurrently/online DDL** to avoid downtime.
- Contrast **schema migrations vs data migrations** and how you schedule/backfill safely.
- Show **Prisma** commands (`migrate dev/deploy`, `db seed`) and **Knex** commands (make/latest/rollback).
- Emphasize **idempotent seeds**, **migrations table**, and **forward-only mindset** for production.

------

Want me to continue with **transactions-and-pooling.md** next?