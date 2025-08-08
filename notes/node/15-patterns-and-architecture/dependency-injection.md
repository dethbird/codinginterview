**dependency-injection.md**

# Dependency Injection (Node.js)

## 📌 What & why

**Dependency Injection (DI)** means you **pass dependencies in** (DB clients, gateways, loggers) instead of importing/instantiating them inside your functions. This makes code **testable**, **swappable** (Stripe → Braintree), and **composable**. You’ll have a **composition root** that wires everything together once at startup, and optionally a **request scope** for per-request state.

------

## Levels of DI (pick pragmatically)

1. **Manual DI (functions/constructors)** — simplest, zero libs.
2. **Factory/container you own** — small registry of builders; supports request scope and cleanup.
3. **Library DI (tsyringe/Awilix/Inversify)** — decorators, scoping, autowiring. Great when the app grows.

> Interview sound bite: “I start with **manual DI** + a small **container factory**. If wiring becomes repetitive, I reach for **Awilix** or **tsyringe** for lifecycles and request scope.”

------

## Manual DI (baseline)

```ts
// ports (interfaces)
export interface EmailSender { send(to: string, subject: string, body: string): Promise<void> }
export interface UserRepo { findByEmail(email: string): Promise<{id:string}|null>; create(...): Promise<any> }

// use case depends on ports, not implementations
export class SignupUser {
  constructor(private users: UserRepo, private email: EmailSender) {}
  async exec(email: string, password: string) {
    if (await this.users.findByEmail(email)) throw new Error('exists');
    const user = await this.users.create({ email, passwordHash: hash(password) });
    await this.email.send(email, 'Welcome', '🎉');
    return user;
  }
}

// composition root (wire once)
import { PrismaClient } from '@prisma/client';
import { SESv3 } from './infra/SESv3';
const prisma = new PrismaClient();
const userRepo: UserRepo = new PrismaUserRepo(prisma);
const emailer: EmailSender = new SESv3(process.env.SES_KEY!);
export const signup = new SignupUser(userRepo, emailer);
```

**Pros:** obvious, no magic. **Cons:** wiring can get verbose as the app grows.

------

## Tiny container you own (with lifecycles & request scope)

```ts
// container.ts
type Factory<T> = (c: Container) => T;
type Disposer = () => Promise<void> | void;

export class Container {
  private singletons = new Map<string, any>();
  private disposers: Disposer[] = [];
  constructor(private regs: Record<string, Factory<any>>) {}

  // singleton: memoize first build
  get<T>(key: keyof ContainerMap & string): T {
    if (!this.singletons.has(key)) this.singletons.set(key, this.regs[key](this));
    return this.singletons.get(key);
  }

  // register a disposer (close DB, stop queues)
  onDispose(d: Disposer) { this.disposers.push(d); }

  async dispose() { for (const d of this.disposers.reverse()) await d(); }
}

// types for safety (optional)
export interface ContainerMap {
  prisma: import('@prisma/client').PrismaClient;
  userRepo: import('./infra/prisma-user-repo').PrismaUserRepo;
  email: import('./infra/ses').SESv3;
  signup: import('./app/usecases/signup-user').SignupUser;
}

// build root container
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepo } from './infra/prisma-user-repo';
import { SESv3 } from './infra/ses';
import { SignupUser } from './app/usecases/signup-user';

export function buildContainer() {
  const regs: Record<string, Factory<any>> = {
    prisma: () => {
      const p = new PrismaClient();
      c.onDispose(() => p.$disconnect()); // close on shutdown
      return p;
    },
    userRepo: (c) => new PrismaUserRepo(c.get('prisma')),
    email: () => new SESv3(process.env.SES_KEY!),
    signup: (c) => new SignupUser(c.get('userRepo'), c.get('email')),
  };
  const c = new Container(regs);
  return c;
}
```

### Request scope (attach to Express)

Use a **child container** or a **context object** per request for transient state (request id, user).

```ts
// request-scope.ts
import type { Request, Response, NextFunction } from 'express';
import { buildContainer } from './container';

export function requestScope(root = buildContainer()) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // shallow clone: share singletons; add request-local values
    (req as any).di = root;                // keep it simple; or create a child map
    (req as any).ctx = { reqId: crypto.randomUUID(), user: req.user ?? null };
    next();
  };
}

// route wiring
app.use(requestScope());
app.post('/signup', async (req, res, next) => {
  try {
    const signup = (req as any).di.get<'signup'>('signup');
    const user = await signup.exec(req.body.email, req.body.password);
    res.status(201).json(user);
  } catch (e) { next(e); }
});
```

------

## DI library: **tsyringe** (lightweight, decorator-based)

```bash
npm i tsyringe reflect-metadata
// enable reflect metadata once (entrypoint)
import 'reflect-metadata';
// services.ts
import { injectable, inject, container, singleton } from 'tsyringe';

export interface Clock { now(): number }
@singleton()
export class SystemClock implements Clock { now(){ return Date.now(); } }

@injectable()
export class SignupUser {
  constructor(
    @inject('UserRepo') private users: UserRepo,
    @inject('EmailSender') private email: EmailSender,
    private clock: SystemClock, // concrete ok if you don’t need to swap
  ) {}
  /* ... */
}

// register implementations
container.register<EmailSender>('EmailSender', { useClass: SESv3 });
container.register<UserRepo>('UserRepo', { useClass: PrismaUserRepo });
container.register(SystemClock, { useClass: SystemClock }); // concrete tokens

// resolve where needed (composition root ideally)
export const signup = container.resolve(SignupUser);
```

**Notes & parameters**

- Use **tokens** (`'UserRepo'`) to bind interfaces to classes: `container.register(token, { useClass | useValue | useFactory })`.
- **Scopes**: tsyringe supports `@singleton()` and `container.createChildContainer()` for request scope.
- Needs **emitDecoratorMetadata** and **experimentalDecorators** in `tsconfig.json`.

------

## DI library: **Awilix** (explicit, no decorators)

```bash
npm i awilix awilix-express
import { createContainer, asClass, asFunction, asValue, Lifetime } from 'awilix';

export const container = createContainer({ injectionMode: 'CLASSIC' })
  .register({
    config: asValue(config),
    prisma: asFunction(() => new PrismaClient()).singleton(),
    userRepo: asClass(PrismaUserRepo).singleton(),
    email: asClass(SESv3).singleton(),
    signup: asClass(SignupUser).scoped(), // one per request
  });

// Express request scope
import { scopePerRequest, makeInvoker } from 'awilix-express';
app.use(scopePerRequest(container));

const api = makeInvoker((cradle: any) => ({
  signup: async (req: any, res: any) => {
    const user = await cradle.signup.exec(req.body.email, req.body.password);
    res.status(201).json(user);
  }
}));
app.post('/signup', api('signup'));
```

**Why Awilix**: clean **lifetime** control (`singleton`, `scoped`, `transient`), great **Express integration**, no decorators.

------

## Logging & config as dependencies (real-world)

```ts
// logger.ts (pino)
import pino from 'pino';
export function makeLogger(env: string) {
  return pino({ level: env === 'production' ? 'info' : 'debug' });
}

// registration
container.register({
  logger: asFunction(() => makeLogger(process.env.NODE_ENV || 'development')).singleton()
});

// usage
class SignupUser {
  constructor(private users: UserRepo, private email: EmailSender, private logger: pino.Logger) {}
  async exec(email: string, pw: string) {
    this.logger.info({ email }, 'signup');
    /* ... */
  }
}
```

------

## Async factories (e.g., DB connect, Redis)

```ts
container.register({
  redis: asFunction(async () => {
    const r = createClient({ url: process.env.REDIS_URL });
    await r.connect();
    return r;
  }, { lifetime: Lifetime.SINGLETON })
});
```

If your DI lib can’t await, initialize such resources **before** building the container and pass them as `asValue`.

------

## Testing with DI (the big win)

```ts
// unit: replace adapters with fakes
class FakeUsers implements UserRepo { /* ... */ }
class FakeEmail implements EmailSender { sent: any[] = []; async send(to,s,b){ this.sent.push({to,s,b}); } }

it('sends welcome email', async () => {
  const uc = new SignupUser(new FakeUsers(), new FakeEmail());
  await uc.exec('a@b.com','pw');
  expect(uc['email'].sent).toHaveLength(1);
});

// integration: build container with a test DB / test emailer
const c = buildContainerForTest({ prismaUrl: testDbUrl, emailer: new FakeEmail() });
```

------

## Lifecycles & cleanup (don’t leak)

- Track disposers for singletons (DB pools, queues, cron). Call on **SIGTERM**.
- In libs:
  - **Prisma**: `await prisma.$disconnect()` on shutdown.
  - **BullMQ**: `await queue.close()`/`worker.close()`.
  - **Redis**: `await client.quit()`.

```ts
process.on('SIGTERM', async () => { await container.dispose(); process.exit(0); });
```

------

## Avoid the **Service Locator** anti-pattern

Passing a global `Container.get('foo')` *inside* your business logic hides dependencies. Prefer **constructor parameters**. If you must use a locator at edges (e.g., Express route factory), keep it there—don’t let it bleed into the domain layer.

------

## Circular dependencies (pitfall)

- Split modules/ports to break cycles.
- Use **factories** instead of constructor injection for bidirectional refs.
- With libraries, defer resolution using `lazyInject` patterns or factories.

------

## Parameterized factories (multi-tenant / per-req)

Sometimes you need a **factory that depends on args** (tenant id, locale). Inject a **factory function**:

```ts
type EmailFactory = (tenantId: string) => EmailSender;

class InviteUser {
  constructor(private makeEmail: EmailFactory) {}
  async exec(tenantId: string, to: string) {
    const email = this.makeEmail(tenantId);
    await email.send(to, 'Invite', 'Join us');
  }
}
```

Register `makeEmail` as a function that builds the right adapter per tenant.

------

## Cheat sheet

- **Pass deps in** (constructors) → testable, swappable.
- Keep a **composition root** that builds concrete adapters and use cases.
- Use **request scope** for per-request state (reqId, user, unit-of-work).
- Pick **Awilix** or **tsyringe** if wiring grows; set lifecycles (`singleton`/`scoped`).
- Track **disposers** and close resources on **SIGTERM**.
- Don’t use a Service Locator in core logic; **inject** instead.

------

## ✅ Interview Tips

- “I code to **ports** and wire **adapters** in a **composition root**.”
- “I keep **request-scoped** dependencies (like a unit-of-work/transaction, request id) and **singleton** infra (DB, logger).”
- “For tests, I pass **fakes** into use cases; no network or DB needed.”
- “I avoid **Service Locator**; if I add a DI lib, I prefer **Awilix** for explicit lifecycles.”

------

Next up: **config-strategy.md**?