**layered-and-clean-architecture.md**

# Layered & Clean Architecture (Node.js)

## 📌 What & why

Keep **business logic independent** of frameworks/DBs so it’s easy to test, swap infra (Postgres → MySQL), and evolve.
 Core ideas: **layers**, **ports/adapters**, **dependency inversion**, **pure use-cases**, and **composition root** (wiring).

------

## Glossary (short + useful)

- **Domain**: business concepts (`Order`, `Invoice`).
- **Use case (application service)**: orchestrates a business action (`CreateOrder`).
- **Port**: interface for an external dependency (`OrderRepo`, `PaymentGateway`).
- **Adapter**: implementation of a port (Prisma repo, Stripe SDK wrapper).
- **Controller/Route**: HTTP edge; translates web → use case, use case → HTTP.
- **DTO**: data contract crossing boundaries (request/response).
- **Composition root**: where you **instantiate** everything and **inject** dependencies.

------

## Folder structure (pragmatic)

```
src/
  domain/
    order.ts               # entities & domain logic
  app/
    usecases/
      create-order.ts      # use case(s)
    ports/
      order-repo.ts        # interfaces (ports)
      payment-gateway.ts
  infra/
    db/
      prisma-client.ts
      prisma-order-repo.ts # adapters
    payments/
      stripe-gateway.ts    # adapters
    outbox/
      outbox-repo.ts
  web/
    http/
      controllers/
        orders.controller.ts
      routes.ts
      errors.ts
  config/
    index.ts
  container.ts             # composition root (DI wiring)
  server.ts                # start HTTP
```

------

## Domain entity (no Node/DB imports here)

```ts
// src/domain/order.ts
export type OrderItem = { sku: string; qty: number; unitPrice: number };
export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public status: 'PENDING'|'PAID'|'CANCELLED' = 'PENDING',
    public totalCents: number = Order.sum(items)
  ) {}

  static sum(items: OrderItem[]) {
    return items.reduce((c, it) => c + it.qty * it.unitPrice, 0);
  }

  markPaid() { if (this.status !== 'PENDING') throw new Error('bad_state'); this.status = 'PAID'; }
}
```

------

## Ports (interfaces)

```ts
// src/app/ports/order-repo.ts
import { Order } from '@/domain/order';
export interface OrderRepo {
  findById(id: string): Promise<Order | null>;
  create(o: Order): Promise<void>;
  update(o: Order): Promise<void>;
}

// src/app/ports/payment-gateway.ts
export interface PaymentGateway {
  chargeCents(params: { orderId: string; userId: string; amount: number; idempotencyKey?: string }): Promise<{ chargeId: string }>;
}
```

------

## Use case (pure, orchestrates)

```ts
// src/app/usecases/create-order.ts
import { z } from 'zod';
import { Order } from '@/domain/order';
import type { OrderRepo } from '@/app/ports/order-repo';
import type { PaymentGateway } from '@/app/ports/payment-gateway';

export const CreateOrderInput = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive(), unitPrice: z.number().int().positive() })).min(1),
  idempotencyKey: z.string().optional()
});
export type CreateOrderInput = z.infer<typeof CreateOrderInput>;

export class CreateOrder {
  constructor(private orders: OrderRepo, private payments: PaymentGateway) {}

  async exec(input: CreateOrderInput) {
    const data = CreateOrderInput.parse(input); // validate at boundary
    const existing = await this.orders.findById(data.orderId);
    if (existing) return existing; // idempotent: return existing

    const order = new Order(data.orderId, data.userId, data.items);
    await this.orders.create(order);

    const { chargeId } = await this.payments.chargeCents({
      orderId: order.id, userId: order.userId, amount: order.totalCents, idempotencyKey: data.idempotencyKey
    });

    order.markPaid();
    await this.orders.update(order);

    return { id: order.id, totalCents: order.totalCents, status: order.status, chargeId };
  }
}
```

------

## Infra adapters (Prisma + Stripe wrappers)

```ts
// src/infra/db/prisma-client.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// src/infra/db/prisma-order-repo.ts
import { Order } from '@/domain/order';
import type { OrderRepo } from '@/app/ports/order-repo';
import { prisma } from './prisma-client';

export class PrismaOrderRepo implements OrderRepo {
  async findById(id: string) {
    const row = await prisma.order.findUnique({ where: { id } });
    return row ? new Order(row.id, row.userId, row.items as any, row.status as any, row.totalCents) : null;
  }
  async create(o: Order) {
    await prisma.order.create({ data: { id: o.id, userId: o.userId, items: o.items as any, status: o.status, totalCents: o.totalCents } });
  }
  async update(o: Order) {
    await prisma.order.update({ where: { id: o.id }, data: { status: o.status, totalCents: o.totalCents } });
  }
}

// src/infra/payments/stripe-gateway.ts
import Stripe from 'stripe';
import type { PaymentGateway } from '@/app/ports/payment-gateway';
export class StripeGateway implements PaymentGateway {
  private s = new Stripe(process.env.STRIPE_KEY!, { apiVersion: '2024-06-20' as any });
  async chargeCents({ orderId, userId, amount, idempotencyKey }) {
    const p = await this.s.paymentIntents.create(
      { amount, currency: 'usd', metadata: { orderId, userId } },
      { idempotencyKey: idempotencyKey ?? `order-${orderId}` }
    );
    return { chargeId: p.id };
  }
}
```

------

## Controller (HTTP edge) + mapping

```ts
// src/web/http/controllers/orders.controller.ts
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { CreateOrder } from '@/app/usecases/create-order';

const Body = z.object({
  orderId: z.string().uuid(),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive(), unitPrice: z.number().int().positive() })),
  idempotencyKey: z.string().optional()
});

export function postCreateOrder(createOrder: CreateOrder) {
  return async (req: Request, res: Response) => {
    const authUserId = req.user?.id as string; // from auth middleware
    const input = Body.parse({ ...req.body, userId: authUserId });
    const result = await createOrder.exec(input);
    res.status(201).json(result);
  };
}
// src/web/http/routes.ts
import express from 'express';
import { postCreateOrder } from './controllers/orders.controller';
import type { CreateOrder } from '@/app/usecases/create-order';

export function routes(createOrder: CreateOrder) {
  const r = express.Router();
  r.post('/orders', postCreateOrder(createOrder));
  return r;
}
```

------

## Composition root (DI wiring)

```ts
// src/container.ts
import { PrismaOrderRepo } from '@/infra/db/prisma-order-repo';
import { StripeGateway } from '@/infra/payments/stripe-gateway';
import { CreateOrder } from '@/app/usecases/create-order';

export function buildContainer() {
  const orderRepo = new PrismaOrderRepo();
  const payments = new StripeGateway();
  const createOrder = new CreateOrder(orderRepo, payments);
  return { createOrder };
}
// src/server.ts
import express from 'express';
import { routes } from '@/web/http/routes';
import { buildContainer } from '@/container';

const app = express();
app.use(express.json());
const c = buildContainer();
app.use('/api', routes(c.createOrder));
app.listen(3000, () => console.log('listening :3000'));
```

> No framework types bleed into **domain/app**. Swapping Stripe → Braintree is a new adapter only.

------

## Transactions & consistency (real-life)

- Keep transaction boundaries **above** repos (use case or service layer).
- With Prisma:

```ts
// in a use case that needs atomicity
await prisma.$transaction(async (tx) => {
  // pass a Tx-bound repo into the code path
  await tx.order.create(/*...*/);
  // write outbox record for events here as part of the same tx
});
```

- **Outbox pattern**: write domain events to an `outbox` table in the same tx; a background worker publishes to Kafka/SNS/Redis reliably.

------

## Errors (don’t leak infra details)

Create **app errors** with safe messages/codes; map to HTTP in the controller.

```ts
// src/web/http/errors.ts
export class AppError extends Error { constructor(public code: string, message: string, public http = 400){ super(message);} }
export class NotFound extends AppError { constructor(msg='not_found'){ super('NOT_FOUND', msg, 404); } }
export class Forbidden extends AppError { constructor(msg='forbidden'){ super('FORBIDDEN', msg, 403); } }

// controller catch
try { /*...*/ } catch (e:any) {
  if (e instanceof AppError) return res.status(e.http).json({ error: e.code, message: e.message });
  // log infra error then:
  return res.status(500).json({ error: 'INTERNAL' });
}
```

------

## Idempotency (real APIs)

Accept an `Idempotency-Key` header, store a response keyed by `(key, userId, route)`, replay on retries. We demonstrated a simple **return existing** pattern using deterministic `orderId`.

------

## Validation boundary

- **At controller**: validate request → DTO (`zod/joi`), clamp limits.
- **At use case**: validate **business inputs** (we used Zod again).
   This keeps infra concerns (HTTP) separate from domain rules.

------

## Ports & Adapters (cheat sheet)

| Port             | Adapter examples                | Why                         |
| ---------------- | ------------------------------- | --------------------------- |
| `OrderRepo`      | Prisma, Knex, Mongoose          | swap DB                     |
| `PaymentGateway` | Stripe, Braintree               | swap provider/mock          |
| `EmailSender`    | SES, SendGrid, Test double      | avoid vendor lock-in in app |
| `Clock`          | `Date.now()`, fake in tests     | deterministic tests         |
| `UUID`           | `crypto.randomUUID`, seeded gen | deterministic tests         |

------

## Testing strategy

- **Unit**: test use cases with **in-memory** adapters.

```ts
// create-order.spec.ts
class InMemOrders implements OrderRepo { store = new Map(); findById(id){ return Promise.resolve(this.store.get(id) ?? null); } create(o){ this.store.set(o.id,o); return Promise.resolve(); } update(o){ this.store.set(o.id,o); return Promise.resolve(); } }
class FakePayments implements PaymentGateway { async chargeCents(){ return { chargeId: 'ch_1' }; } }

it('creates & pays order', async () => {
  const uc = new CreateOrder(new InMemOrders(), new FakePayments());
  const res = await uc.exec({ orderId: crypto.randomUUID(), userId: crypto.randomUUID(), items: [{ sku:'s1', qty:1, unitPrice:1000 }] });
  expect(res.status).toBe('PAID');
});
```

- **Integration**: hit HTTP with **Supertest** using a **test container** Postgres or sqlite.
- **Contract**: if you publish events, validate schemas with `zod` or JSON Schema.

------

## Common pitfalls (and fixes)

- **Anemic domain model** (no behavior) → put invariants/operations *inside* entities where useful (`markPaid()`).
- **Leaky abstractions** (Prisma types in use case) → keep mappers in adapters.
- **God service** (one giant use case) → split by business action; compose when needed.
- **Cross-layer imports** → enforce with ESLint boundaries (dep-cruiser / import groups).
- **Hidden transactions** inside repo calls → make tx boundaries explicit.

------

## Optional niceties

- **DI library** (`tsyringe`, `typedi`) if wiring grows.
- **Feature flags** port (`FlagProvider`) → adapter for LaunchDarkly/ConfigCat.
- **CQRS**: separate write (use cases) from read (optimized queries) when read shapes explode.
- **ACL/Policies**: a `Policy` service that answers “can user X do Y to Z?”

------

## Minimal ESLint boundaries rule (snippet)

```js
// .eslintrc.cjs
rules: {
  'no-restricted-imports': ['error', {
    patterns: [
      { group: ['@/infra/**'], message: 'Infra cannot be imported from app/domain' }
    ]
  }]
}
```

------

## ✅ Interview Tips

- “**Use cases** orchestrate; **entities** hold core rules; **controllers** just translate.”
- “I code to **ports** and inject **adapters** in the **composition root** (dependency inversion).”
- “I keep **transactions** at the use-case level and use **outbox** for reliable events.”
- “Validation at the **edge** + in the **use case**; map errors to HTTP without leaking infra details.”
- “This lets me swap Prisma/Stripe without touching business logic and test use cases with **in-memory fakes**.”

------

Want to continue with **dependency-injection.md** or jump to **config-strategy.md** next?