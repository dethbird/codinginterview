**mongodb-mongoose.md**

# MongoDB & Mongoose

## 📌 What & why

- **MongoDB Node driver**: low-level API that maps closely to MongoDB commands. Use it when you need full control over indexes, aggregation, transactions, or you care about every allocation and query option.
- **Mongoose**: an ODM that adds schemas, validation, hooks, and TypeScript types on top. Use it for app code where consistent shapes and lifecycle hooks matter more than raw speed.

------

## Install

```bash
npm i mongodb            # official driver
npm i mongoose           # optional ODM layer
```

*Install the driver for infra scripts or performance-critical services; add Mongoose where model-level validation/middleware improves team velocity.*

------

## MongoDB Driver (low-level) — Core Patterns

### Connect & reuse a single client (pooling)

```ts
import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGODB_URI!, { maxPoolSize: 20 });

export async function db() {
  if (!client.topology?.isConnected()) await client.connect();
  return client.db(process.env.MONGODB_DB || 'app');
}
```

*Create the client once and share it. The driver manages an internal pool, so you avoid reconnect storms and keep TLS handshakes amortized.*

------

### Collections & basic CRUD (with types)

```ts
type User = { _id: import('mongodb').ObjectId; email: string; name: string; active: boolean; createdAt: Date };
const users = (await db()).collection<User>('users');

await users.insertOne({ _id: new ObjectId(), email: 'a@b.com', name: 'Alice', active: true, createdAt: new Date() });
const u = await users.findOne({ email: 'a@b.com' });
await users.updateOne({ email: 'a@b.com' }, { $set: { active: false } });
await users.deleteOne({ email: 'a@b.com' });
```

*The driver returns plain JS objects. Add TypeScript generics to catch field typos and make refactors safer.*

------

### Upsert & idempotency

```ts
await users.updateOne(
  { email: 'a@b.com' },
  { $setOnInsert: { createdAt: new Date() }, $set: { name: 'Alice' } },
  { upsert: true }
);
```

*Upsert lets you “create or update” in one round trip. Pair it with unique indexes or idempotency keys to make retries safe.*

------

### Bulk write (fast batched ops)

```ts
await users.bulkWrite([
  { updateOne: { filter: { email: 'a@b.com' }, update: { $set: { active: true } }, upsert: true } },
  { insertOne: { document: { _id: new ObjectId(), email: 'c@d.com', name: 'Carol', active: true, createdAt: new Date() } } }
], { ordered: false });
```

*`bulkWrite` is dramatically faster than many individual calls and can continue past errors when `ordered:false`.*

------

### Indexes (do this early)

```ts
await users.createIndex({ email: 1 }, { unique: true });
await users.createIndex({ active: 1, createdAt: -1 });
await users.createIndex({ "address.location": "2dsphere" });
await users.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
```

*Indexes match your most common filters/sorts. Unique prevents duplicates, TTL auto-expires docs, and 2dsphere enables geo queries.*

------

### Pagination (cursor-based > skip/limit for deep pages)

```ts
const pageSize = 20;
const after = req.query.after ? new ObjectId(String(req.query.after)) : new ObjectId('ffffffffffffffffffffffff');
const page = await users.find({ _id: { $lt: after } }, { projection: { email: 1, name: 1 } })
  .sort({ _id: -1 }).limit(pageSize).toArray();
```

*Keyset pagination uses a stable index (often `_id`) to avoid the O(n) cost of large `skip` values and keeps pages fast at any depth.*

------

### Aggregation (reporting/ETL)

```ts
const activeCountsByMonth = await users.aggregate([
  { $match: { active: true } },
  { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
  { $sort: { "_id.y": 1, "_id.m": 1 } }
]).toArray();
```

*Pipelines let the DB do heavy lifting (filter/group/sort) server-side, reducing data transfer and app CPU.*

------

### Transactions (multi-doc ACID on replica sets / Atlas)

```ts
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    const dbx = client.db();
    await dbx.collection('orders').insertOne({ userId, items, createdAt: new Date() }, { session });
    await dbx.collection('inventory').updateOne({ sku }, { $inc: { qty: -1 } }, { session });
  });
} finally { await session.endSession(); }
```

*Use transactions when multiple documents must change atomically (e.g., order + inventory). Requires replica set/Atlas.*

------

### ObjectId handling & validation

```ts
import { ObjectId } from 'mongodb';
function asObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('bad_id');
  return new ObjectId(id);
}
```

*Always validate and convert IDs at your API boundary; strings won’t match `_id` unless they are proper `ObjectId`s.*

------

### Error mapping (HTTP)

```ts
try { await users.insertOne({ email }); }
catch (e: any) {
  if (e.code === 11000) return res.status(409).json({ error: 'duplicate' });
  throw e;
}
```

*Map database realities to clear HTTP errors (duplicates → 409). This makes client behavior predictable.*

------

## Mongoose (ODM) — Schemas, Validation, Middleware

### Connect once

```ts
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB || 'app' });
```

*Mongoose manages its own connection state; connect during boot, not per request.*

------

### Define a schema & model (with indexes)

```ts
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
  name:  { type: String, required: true, trim: true, maxlength: 120 },
  active:{ type: Boolean, default: true },
  roles: { type: [String], default: [] },
  createdAt: { type: Date, default: () => new Date(), index: true }
}, { timestamps: true, versionKey: false, strict: true });

userSchema.index({ active: 1, createdAt: -1 });
export const User = model('User', userSchema);
```

*Schemas enforce shape and constraints at the app layer; indexes are still created in MongoDB for query speed.*

------

### Create/read/update/delete

```ts
const u = await User.create({ email: 'a@b.com', name: 'Alice' });
const found = await User.findOne({ email: 'a@b.com' }).lean();
await User.updateOne({ _id: u._id }, { $addToSet: { roles: 'admin' } });
await User.deleteOne({ _id: u._id });
```

*`.lean()` returns plain objects (no getters/methods), which is faster for read-heavy endpoints.*

------

### Validation & custom rules

```ts
userSchema.path('email').validate((v: string) => /@/.test(v), 'invalid_email');
```

*Model-level validators catch bad data before it hits the DB and centralize rules near your schema.*

------

### Middleware (hooks)

```ts
userSchema.pre('save', function(next) {
  if (!this.name) return next(new Error('name_required'));
  next();
});
userSchema.post('save', function(doc) {
  // enqueue email, publish event, etc.
});
```

*Hooks let you attach side-effects or invariants to lifecycle events without littering route code.*

------

### Virtuals & toJSON shaping

```ts
userSchema.virtual('isStaff').get(function() { return this.roles?.includes('admin'); });
userSchema.set('toJSON', {
  transform(_doc, ret) { ret.id = String(ret._id); delete ret._id; return ret; }
});
```

*Virtuals compute fields on the fly; `toJSON` transforms keep API responses tidy and stable.*

------

### Lean queries (performance)

```ts
const list = await User.find({ active: true }).select('email name').sort({ createdAt: -1 }).limit(20).lean();
```

*Use `.lean()` for hot paths to skip document hydration and reduce GC pressure.*

------

### Transactions with Mongoose

```ts
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await User.create([{ email: 'x@y.com', name: 'X' }], { session });
});
await session.endSession();
```

*Same ACID capabilities as the driver, using the Mongoose session API for a consistent experience across models.*

------

### Discriminators (inheritance-like models)

```ts
const base = new Schema({ title: String }, { discriminatorKey: 'kind' });
const Content = model('Content', base);
const Post = Content.discriminator('Post', new Schema({ body: String }));
const Video = Content.discriminator('Video', new Schema({ url: String }));
```

*Discriminators share a base collection + schema while letting subtypes add fields—handy for polymorphic “content” models.*

------

### TTL & text indexes with Mongoose

```ts
const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, index: true },
  expiresAt: { type: Date, index: { expires: 0 } }
});
sessionSchema.index({ content: 'text' });
```

*TTL indexes expire documents automatically (e.g., sessions). Text indexes enable basic full-text search without extra infra.*

------

### Unique constraints (DB-level)

```ts
userSchema.index({ email: 1 }, { unique: true });
try { await User.create({ email: 'a@b.com', name: 'A' }); }
catch (e: any) { if (e.code === 11000) /* respond 409 */; }
```

*Always back app-level “unique” with an actual unique index; catch E11000 for friendly errors.*

------

## Real-World Examples

### 1) Safe “get by id” handler (driver)

```ts
import { ObjectId } from 'mongodb';

export async function getUserHandler(req, res) {
  try {
    const id = new ObjectId(String(req.params.id));
    const user = await (await db()).collection('users')
      .findOne({ _id: id }, { projection: { email: 1, name: 1 } });
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json({ id: String(user._id), email: user.email, name: user.name });
  } catch { res.status(400).json({ error: 'bad_id' }); }
}
```

*Validate IDs, project only needed fields, and return clean 404/400 codes.*

------

### 2) List with keyset pagination & filters (Mongoose)

```ts
const per = Math.min(100, Number(req.query.per || 20));
const after = req.query.after ? new mongoose.Types.ObjectId(String(req.query.after)) : undefined;
const where: any = { active: true }; if (after) where._id = { $lt: after };

const rows = await User.find(where).select('email name createdAt').sort({ _id: -1 }).limit(per).lean();
res.json({ items: rows, next: rows.at(-1)?._id });
```

*Stable ordering + `_id` cursor avoids slow deep pages and makes the client’s “load more” trivial.*

------

### 3) Idempotent order creation (driver + unique token)

```ts
const orders = (await db()).collection('orders');
await orders.createIndex({ idempotencyKey: 1 }, { unique: true });

async function createOrder({ userId, items, key }) {
  try {
    await orders.insertOne({ _id: new ObjectId(), userId, items, idempotencyKey: key, createdAt: new Date() });
  } catch (e: any) {
    if (e.code === 11000) return; // already created
    throw e;
  }
}
```

*Idempotency allows safe retries on flaky networks or duplicate form submits.*

------

## Performance & Ops Tips

- **Shape queries to indexes**: ensure your filter/sort fields match index prefixes; otherwise Mongo scans.
- **Prefer keyset pagination**: use `_id` or a timestamp to keep latency flat as data grows.
- **Use `.lean()`** for reads in Mongoose to cut overhead; hydrate only when you need methods/virtuals.
- **Bound document size**: keep blobs in object storage; store URLs/metadata in Mongo.
- **Bulk operations**: use `bulkWrite`/`updateMany` for mass changes rather than per-doc loops.
- **Timeouts/retries**: set driver timeouts and handle transient network errors for read operations.

------

## Common Pitfalls

- Treating `_id` strings as-is → **convert** to `ObjectId` in filters or queries won’t match.
- Relying on Mongoose validators without **DB indexes** to enforce uniqueness under concurrency.
- Using `skip/limit` for deep pages → slow; switch to keyset.
- Forgetting `.lean()` in hot paths → extra GC and slower responses.
- Soft deletes without proper indexes → queries become slow unless you index `{ deletedAt: 1, ... }`.

------

## ✅ Interview Tips

- Driver vs Mongoose: **control/perf** vs **schemas/hooks/DX** — know when to pick each.
- Show **unique/TTL/compound** indexes and how they serve query patterns.
- Demonstrate **transactions** for multi-doc consistency and **bulkWrite** for throughput.
- Explain **keyset pagination**, `.lean()`, and mapping **E11000→409** cleanly.
- Emphasize **ObjectId validation** and projection to reduce payloads.

------

Want me to expand any specific subsection further (e.g., aggregations, transactions, or Mongoose hooks)?