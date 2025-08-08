**error-handling-patterns.md**

# Error Handling Patterns (Node.js + TS)

## 📌 Goals

- **Predictable**: one way to create, throw, catch, and **map** errors.
- **Actionable**: errors carry **machine-readable codes** and context (no PII).
- **Centralized**: a single **HTTP/gRPC/GraphQL** mapper; logs correlate via **request id**.
- **Separation**: **Programmer vs Operational vs Domain** errors handled differently.

------

## Error taxonomy (use this language in interviews)

- **Programmer errors** (bugs): null deref, wrong assumptions. **Crash fast** or return 500.
- **Operational errors** (environment): DB down, timeout, network. **Retry/transform/503**.
- **Domain/app errors** (expected): “email already used”, “forbidden”. **Return 4xx with code**.

------

## Design: a small error class family

```ts
// src/web/http/errors.ts
export type ErrorCode =
  | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND'
  | 'CONFLICT' | 'UNPROCESSABLE' | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly http: number;
  public readonly details?: Record<string, unknown>;
  constructor(code: ErrorCode, message: string, http = 400, details?: Record<string, unknown>, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.http = http;
    this.details = details;
    if (cause) (this as any).cause = cause; // Node supports Error#cause; TS narrow
    Error.captureStackTrace?.(this, AppError);
  }
}
// Convenience subclasses (optional)
export class NotFound extends AppError { constructor(msg='not_found', d?: any, c?: any){ super('NOT_FOUND', msg, 404, d, c); } }
export class Forbidden extends AppError { constructor(msg='forbidden', d?: any, c?: any){ super('FORBIDDEN', msg, 403, d, c); } }
export class Conflict extends AppError { constructor(msg='conflict', d?: any, c?: any){ super('CONFLICT', msg, 409, d, c); } }
```

**Notes on args/params**

- `code`: machine-readable key you assert on in clients/tests.
- `http`: default status mapping for HTTP edge.
- `details`: small, serializable context (IDs, counts)—no secrets.
- `cause`: preserves the original error (`new AppError(..., { cause: err })`).

------

## Throwing errors (domain/app layer)

```ts
// src/app/usecases/register-user.ts
import { Conflict } from '@/web/http/errors';

export async function registerUser(repo: UserRepo, email: string, hash: string) {
  const exists = await repo.findByEmail(email);
  if (exists) throw new Conflict('email_exists', { email: mask(email) });
  await repo.insert({ email, passwordHash: hash });
}
```

**Guidelines**

- Never `throw 'string'` or random objects—**always `Error`** (or subclass).
- Keep **message** human-friendly; keep IDs/extra context in **details**.
- Avoid PII in messages; mask in details.

------

## Express: central error middleware

```ts
// src/web/http/error-middleware.ts
import { AppError } from './errors';
import type { ErrorRequestHandler } from 'express';
import { log } from '@/logger'; // pino instance
import { nanoid } from 'nanoid';

export const requestId = (req: any, _res: any, next: any) => { req.id = req.id || nanoid(); next(); };

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const rid = (req as any).id;
  const isApp = err instanceof AppError;
  const http = isApp ? err.http : 500;
  const body = {
    type: 'about:blank',              // RFC 7807-ish shape (Problem Details)
    title: isApp ? err.code : 'INTERNAL',
    status: http,
    detail: isApp ? err.message : 'internal_error',
    instance: req.originalUrl,
    requestId: rid,
    ...(isApp && err.details ? { details: err.details } : {})
  };

  // Log with cause & safe context
  log.error({ err, code: isApp ? err.code : 'INTERNAL', http, rid, path: req.path, method: req.method }, 'request_error');

  // Don’t leak stack to client
  res.status(http).json(body);
};
```

**Wire it**

```ts
app.use(requestId);
// ...routes
app.use(errorHandler);
```

------

## Async route wrapper (no forgotten `try/catch`)

```ts
export const asyncHandler =
  <T extends any[], R>(fn: (...args: T) => Promise<R>) =>
  (...args: T) => fn(...args).catch(args[2]); // passes error to next()
app.post('/users', asyncHandler(async (req, res) => {
  await registerUser(userRepo, req.body.email, req.body.password);
  res.status(201).end();
}));
```

------

## Mapping other edges

### GraphQL (Apollo)

```ts
import { GraphQLError } from 'graphql';
import { AppError } from '@/web/http/errors';

function toGraphQLError(e: unknown) {
  if (e instanceof AppError) return new GraphQLError(e.message, { extensions: { code: e.code, details: e.details } });
  return new GraphQLError('internal_error', { extensions: { code: 'INTERNAL' } });
}
```

### gRPC (@grpc/grpc-js)

```ts
import { status } from '@grpc/grpc-js';
import { AppError } from '@/web/http/errors';

function toGrpc(e: unknown) {
  if (e instanceof AppError) {
    const map: Record<string, number> = {
      BAD_REQUEST: status.INVALID_ARGUMENT,
      UNAUTHORIZED: status.UNAUTHENTICATED,
      FORBIDDEN: status.PERMISSION_DENIED,
      NOT_FOUND: status.NOT_FOUND,
      CONFLICT: status.ALREADY_EXISTS,
      UNPROCESSABLE: status.FAILED_PRECONDITION,
      RATE_LIMITED: status.RESOURCE_EXHAUSTED,
      INTERNAL: status.INTERNAL
    };
    return { code: map[e.code] ?? status.UNKNOWN, message: e.message };
  }
  return { code: status.INTERNAL, message: 'internal_error' };
}
```

------

## Validation errors (Zod/Joi → 422)

```ts
import { ZodError } from 'zod';
import { AppError } from './errors';

export function fromZod(zerr: ZodError) {
  return new AppError(
    'UNPROCESSABLE',
    'validation_failed',
    422,
    { fieldErrors: zerr.flatten().fieldErrors }
  );
}
```

Use in controllers:

```ts
try { Schema.parse(req.body); } catch (e) {
  if (e instanceof ZodError) throw fromZod(e);
  throw e;
}
```

------

## Retries, timeouts, idempotency (operational errors)

- **Set timeouts** on all I/O (HTTP, DB, Redis). If a call exceeds budget, **abort** and map to **503/504** (operational).
- **Retry** only **idempotent** operations and only on **transient** errors (ECONNRESET, ETIMEDOUT, 429, 5xx). Use **exponential backoff + jitter**.
- **Idempotency keys** (header or deterministic IDs) so retried writes don’t duplicate.

```ts
// simple retry wrapper
async function retry<T>(fn: () => Promise<T>, attempts = 3) {
  let last; for (let i=0;i<attempts;i++) {
    try { return await fn(); } catch (e: any) {
      last = e; if (!isTransient(e) || i === attempts-1) throw e;
      await new Promise(r => setTimeout(r, (2 ** i) * 100 + Math.random()*100));
    }
  } throw last;
}
```

------

## Logging & correlation

- Log **one error** per failure path at the edge (middleware). Internal layers should either **wrap and rethrow** or **return** results—avoid duplicate logs.
- Include `requestId`, `userId` (if available), `route`, and **error code**.
- Correlate with tracing: attach `trace_id`/`span_id` to logs (see tracing notes).

------

## Wrapping with `cause` (keep stacks intact)

```ts
try {
  await thirdParty();
} catch (e) {
  throw new AppError('INTERNAL', 'payment_provider_failure', 502, { provider: 'stripe' }, e);
}
```

**Why**: keeps original stack under `err.cause` for troubleshooting while you **sanitize** the outward message.

------

## HTTP response shape (Problem Details lite)

```json
{
  "type": "about:blank",
  "title": "NOT_FOUND",
  "status": 404,
  "detail": "not_found",
  "instance": "/api/orders/123",
  "requestId": "r_9J1x…",
  "details": { "orderId": "123" }
}
```

**Clients** assert on `title` (code) or `status`, show user-friendly messages locally.

------

## Graceful shutdown on fatal programmer errors

If you detect **invariant violations** (e.g., impossible state), **log at fatal**, return 500, and consider **terminating the process** (let the supervisor restart). Keep this rare and explicit.

```ts
process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'uncaught_exception'); process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  log.fatal({ err: reason }, 'unhandled_rejection'); process.exit(1);
});
```

> In dev, use `--unhandled-rejections=strict` and fix root causes.

------

## Testing patterns

```ts
import { Conflict } from '@/web/http/errors';
it('registerUser: conflict on duplicate', async () => {
  await repo.insert({ email:'a@b.com', passwordHash:'x' });
  await expect(registerUser(repo, 'a@b.com', 'pw')).rejects.toThrow(Conflict);
});

it('error middleware: maps AppError', async () => {
  const res = await request(app).get('/oops').expect(404);
  expect(res.body.title).toBe('NOT_FOUND');
  expect(res.body.requestId).toBeDefined();
});
```

------

## Common pitfalls (and fixes)

- **Mixing concerns**: throwing HTTP responses from deep layers → *throw `AppError`*, map at the edge.
- **Leaking secrets** in messages/logs → keep secrets in memory only; redact in logs; store context in `details` (masked).
- **Double logging** the same error → log **once** in middleware; inner layers rethrow.
- **Inconsistent codes** → define a **canonical set** and reuse everywhere.
- **Catching and ignoring** errors → always **handle**, **transform**, or **rethrow** with context.

------

## ✅ Interview Tips

- “We classify errors as **programmer**, **operational**, and **domain**; domain errors map to 4xx with **codes**.”
- “All routes use an **async wrapper** and a **central error middleware** that returns a Problem-Details-like JSON.”
- “We **preserve cause** (`Error#cause`) and add non-PII **details** for support.”
- “Operational errors get **timeouts/retries** with backoff; writes use **idempotency keys**.”
- “Logs include **requestId** and error **code**; we avoid duplicate logs and tie them to traces.”