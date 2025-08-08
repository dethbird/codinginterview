**orm-prisma-knex.md**

# ORM & Query Builders: Prisma & Knex

## 📌 What & why

- **Prisma**: schema-first ORM that **generates a typed client**. Great DX, automatic joins, safe migrations, and excellent TypeScript types. Best when you control the schema and want productivity + safety.
- **Knex**: **SQL query builder** (not an ORM). You write SQL-shaped JS with composable chains. Great when you need **full SQL control**, custom SQL features, or want to pair with a lightweight model layer.

------

## Prisma (schema-first ORM)

### Install & init

```bash
npm i prisma @prisma/client
npx prisma init               # creates prisma/schema.prisma and .env
```

**`schema.prisma` (core fields & params)**

```prisma
datasource db {
  provider = "postgresql"     // "mysql" | "sqlite" | "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String  @id @default(cuid())
  email     String  @unique
  name      String?
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  body      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
```

- `provider`: DB driver.
- `@id`, `@default`, `@unique`, `@relation`: constraints & relations.
- `@@index`: compound indexes.

### Generate client & migrate

```bash
npx prisma migrate dev --name init        # creates SQL & applies to DB
npx prisma generate                       # emit typed client
```

### Using the client (arguments & patterns)

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// SELECT: fields & relations
const u = await prisma.user.findUnique({
  where: { email: 'a@b.com' },
  select: { id: true, email: true, posts: { select: { id: true, title: true } } }
});

// LIST: filters, order, pagination
const page = 1, per = 20;
const users = await prisma.user.findMany({
  where: { active: true, email: { contains: '@', mode: 'insensitive' } },
  orderBy: { createdAt: 'desc' },
  skip: (page-1)*per, take: per
});

// UPSERT (idempotent create-or-update)
await prisma.user.upsert({
  where: { email: 'a@b.com' },
  update: { name: 'Alice' },
  create: { email: 'a@b.com', name: 'Alice' }
});

// BULK
await prisma.user.createMany({
  data: [{ email: 'x@y.com' }, { email: 'z@y.com' }],
  skipDuplicates: true
});
```

**Transactions & concurrency**

```ts
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { userId } });
  await tx.orderItem.create({ data: { orderId: order.id, sku, qty: 1 } });
}); // auto-commit/rollback
```

**Raw SQL (parameterized)**

```ts
const rows = await prisma.$queryRaw<{ id: string }[]>`
  SELECT id FROM "User" WHERE email = ${email}
`;
```

- Use the **template tag** to bind params safely (`${}` escapes values).

**Performance knobs**

- Use `select`/`include` to **only fetch what you need**.
- Prefer **cursor pagination** (`cursor`, `take`, `skip`) for deep lists.
- Long-lived processes: call `await prisma.$disconnect()` on shutdown.

**Gotchas (real work)**

- Prisma manages the connection pool internally; if using **PgBouncer** in transaction mode, verify Prisma version/notes.
- Generated client matches your schema: **re-generate** after schema changes.
- Complex SQL (CTEs, window functions) → use `$queryRaw` or pair Prisma for CRUD + SQL for reports.

------

## Knex (SQL query builder)

### Install & configure

```bash
npm i knex pg       # pg|mysql2|sqlite3 depending on DB
npx knex init       # creates knexfile.js
```

**`knexfile.js` (important params)**

```js
export default {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },            // tune per-app instance
  migrations: { tableName: '_knex_migrations', directory: './migrations' },
  seeds: { directory: './seeds' }
};
```

**Create a singleton**

```ts
import knex from 'knex';
import config from './knexfile.js';
export const db = knex(config);
```

### Query building (arguments & patterns)

```ts
// SELECT with where/order/limit
const rows = await db('users')
  .select('id', 'email')
  .where({ active: true })
  .andWhere('email', 'like', '%@%')
  .orderBy('created_at', 'desc')
  .limit(20)
  .offset(0);

// INSERT with RETURNING (Postgres)
const [user] = await db('users')
  .insert({ email: 'a@b.com', name: 'Alice' })
  .returning(['id', 'email']);

// UPSERT (Postgres)
await db('users')
  .insert({ id, email, name })
  .onConflict('id')
  .merge({ email, name });

// UPDATE
await db('users').where({ id }).update({ name: 'Alicia' });

// DELETE
await db('users').where({ id }).del();
```

**Transactions**

```ts
await db.transaction(async (trx) => {
  const [{ id: orderId }] = await trx('orders').insert({ user_id: userId }).returning(['id']);
  await trx('order_items').insert({ order_id: orderId, sku, qty: 1 });
}); // throws → rollback
```

**Conditionally build queries**

```ts
const q = db('users').select('id','email').where('active', true);
if (search) q.andWhere('email', 'ilike', `%${search}%`); // Postgres ilike
const result = await q;
```

**Raw SQL (parameterized)**

```ts
const { rows } = await db.raw('SELECT id FROM users WHERE email = ?', [email]);
```

**Streaming large results**

```ts
import fs from 'node:fs';
const stream = db('users').where('active', true).stream();
stream.on('data', (row) => fs.appendFileSync('users.jsonl', JSON.stringify(row) + '\n'));
await new Promise((res, rej) => stream.on('end', res).on('error', rej));
```

**Migrations & seeds**

```bash
npx knex migrate:make create_users
npx knex migrate:latest
npx knex seed:make seed_users
npx knex seed:run
```

**Example migration**

```js
// migrations/20240101_create_users.js
export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('email').notNullable().unique();
    t.text('name');
    t.boolean('active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}
export async function down(knex) { await knex.schema.dropTable('users'); }
```

**TypeScript tip (nice DX)**

- Augment Knex table typings so `.select()` knows columns:

```ts
// types/knex.d.ts
import 'knex';
declare module 'knex/types/tables' {
  interface User { id: string; email: string; name: string | null; active: boolean; created_at: string; }
  interface Tables { users: User; }
}
```

**Gotchas (real work)**

- Knex gives you rope: **validate inputs** and stick to **parameter binding**.
- Different DBs have different features; your chains should target a known dialect.
- For complex pagination, write **explicit SQL** (keyset) to keep performance predictable.

------

## Choosing between Prisma & Knex (rule-of-thumb)

- Pick **Prisma** when:
  - Your team is TS-heavy and wants **generated types** and **rapid CRUD**.
  - You control schema and like Prisma Migrate.
  - You value DX over hand-tuned SQL, with the escape hatch of `$queryRaw`.
- Pick **Knex** when:
  - You need **SQL-first** control (CTEs, window functions, vendor-specific features) everywhere.
  - You’re migrating a legacy schema or mixing ORMs is risky.
  - You want to pair a builder with **light models** and keep SQL obvious.

------

## Real-world snippets

### Repository (Prisma) with cursor pagination

```ts
export async function listUsers({ after, take = 20 }: { after?: string; take?: number }) {
  return prisma.user.findMany({
    where: { active: true, ...(after ? { id: { lt: after } } : {}) },
    orderBy: { id: 'desc' },
    take
  });
}
```

### Repository (Knex) with keyset pagination

```ts
export async function listUsers({ after, take = 20 }) {
  const q = db('users').select('id','email','name').where('active', true).orderBy('id', 'desc').limit(take);
  if (after) q.andWhere('id', '<', after);
  return q;
}
```

### Idempotent create (both)

- **Prisma**: `upsert({ where, update, create })`
- **Knex (PG)**: `.insert(...).onConflict('key').merge(...)`

------

## ✅ Interview Tips

- Define **ORM vs query builder** succinctly; cite Prisma’s generated types vs Knex’s SQL control.
- Show an **upsert**, a **transaction**, and **cursor pagination** in each.
- Mention **parameter binding** for raw SQL and when you’d drop down to it.
- Call out **migrations**: Prisma Migrate vs Knex migrations — know basic commands.
- Discuss **pool sizing** and why per-request new clients are bad.

------

Want me to proceed with **migrations-and-seeding.md** next?