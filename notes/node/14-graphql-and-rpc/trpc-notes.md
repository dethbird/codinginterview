**trpc-notes.md**

# tRPC Notes (end-to-end types for APIs)

## 📌 What & why

**tRPC** lets you build **type-safe RPC APIs** *without* a schema/IDL. Your server router types flow to the client at compile-time, so **input/output are fully typed** across the wire. It works great with **React Query** (caching) and with any HTTP server (Express/Fastify/Next.js).

> Interview line: “I use tRPC when the **client and server share TypeScript**. I get end-to-end types, Zod validation, React Query caching, and easy server-to-server calls via `createCaller`. For public APIs or polyglot clients, I’d use REST or GraphQL.”

------

## Install (v10+)

```bash
npm i @trpc/server zod
# HTTP adapters (pick one)
npm i @trpc/server @trpc/server/adapters/express express cors
# Client choices:
npm i @trpc/client          # bare client (server-to-server or simple apps)
npm i @trpc/react-query @tanstack/react-query   # React apps
# (Optional) WebSockets for subscriptions
npm i ws @trpc/server/adapters/ws
# (Optional) Serialization for Dates/BigInt, etc.
npm i superjson
```

------

## Core concepts (quick)

- **Router**: collection of procedures, e.g. `user.getById`, `post.create`.
- **Procedure**: `.query()` (read), `.mutation()` (write), `.subscription()` (realtime).
- **Input validation**: usually **Zod** via `.input(z.object(...))`.
- **Context (`ctx`)**: per-request data (db clients, `user`, etc.).
- **Middleware**: run before handlers (auth, rate-limit, logging).
- **Caller**: `router.createCaller(ctx)` → call procedures **from server code** without HTTP.

------

## Server setup (Express)

```ts
// src/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { inferAsyncReturnType } from '@trpc/server';
import type { Request } from 'express';
import { ZodError, z } from 'zod';

// Build context for each request (auth/db/etc.)
export function createContext({ req }: { req: Request }) {
  const token = req.headers.authorization?.replace(/^Bearer\s/i, '');
  const user = token ? verifyJwt(token) : null; // implement verifyJwt
  return { user, db: prisma }; // provide your Prisma/DB client
}
export type Context = inferAsyncReturnType<typeof createContext>;

// Init tRPC core
const t = initTRPC.context<Context>().create({
  transformer: superjson,        // handles Dates, Maps, BigInt nicely
  errorFormatter({ shape, error }) {
    // Optional: surface Zod issues cleanly to client
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      }
    };
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use((opts) => {
  if (!opts.ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return opts.next({ ctx: opts.ctx });
});
```

**Key parameters**

- `initTRPC.context<Ctx>().create({ transformer, errorFormatter })`
  - `transformer`: (e.g., `superjson`) for richer JSON types.
  - `errorFormatter`: shape server errors for clients (Zod, codes).
- `TRPCError({ code, message })`: set proper error codes (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `PRECONDITION_FAILED`, `INTERNAL_SERVER_ERROR`).

------

## Build routers & procedures

```ts
// src/routers/user.ts
import { router, publicProcedure, authedProcedure } from '@/trpc';
import { z } from 'zod';

export const userRouter = router({
  // GET /user.getById
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const u = await ctx.db.user.findUnique({ where: { id: input.id } });
      if (!u) throw new TRPCError({ code: 'NOT_FOUND' });
      return u; // output type inferred to client
    }),

  // PATCH /user.updateName (requires auth)
  updateName: authedProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user!.id },
        data: { name: input.name }
      });
    }),
});
// src/routers/post.ts
import { router, publicProcedure, authedProcedure } from '@/trpc';
import { z } from 'zod';

const Cursor = z.object({ cursor: z.string().nullish(), limit: z.number().int().min(1).max(100).default(20) });

export const postRouter = router({
  list: publicProcedure
    .input(Cursor.optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const items = await ctx.db.post.findMany({
        take: limit + 1,
        ...(input?.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
      });
      const next = items.length > limit ? items.pop()! : null;
      return { items, nextCursor: next?.id ?? null };
    }),

  create: authedProcedure
    .input(z.object({ title: z.string().min(1).max(140), body: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: { ...input, authorId: ctx.user!.id }
      });
    }),
});
// src/routers/index.ts
import { router } from '@/trpc';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
});
export type AppRouter = typeof appRouter;
```

------

## Mount on Express

```ts
// src/server.ts
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '@/routers';
import { createContext } from '@/trpc';

const app = express();
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

app.listen(3000, () => console.log('tRPC on http://localhost:3000/trpc'));
```

**Adapter params**

- `createExpressMiddleware({ router, createContext, onError })`
  - `router`: your root router.
  - `createContext`: per-request context builder.
  - `onError`: (optional) central logging.

------

## Client usage

### React (with React Query)

```ts
// src/trpcClient.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/routers';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      loggerLink({ enabled: (opts) => process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error) }),
      httpBatchLink({ url: '/trpc', headers: () => ({ authorization: `Bearer ${getToken()}` }) }),
    ],
  });
}
// src/main.tsx (React root)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getTRPCClient } from './trpcClient';

const queryClient = new QueryClient();
const trpcClient = getTRPCClient();

root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
// In a component
import { trpc } from '@/trpcClient';

function Posts() {
  const posts = trpc.post.list.useQuery({ limit: 20 });
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => posts.refetch(), // or invalidate queries
  });
  // ...
}
```

**Common link args**

- `httpBatchLink({ url, headers, fetch? })` → batches calls, set auth headers.
- `loggerLink({ enabled })` → debug in dev.
- `wsLink({ client })` → for subscriptions over WebSocket.

### Bare client (non-React / server-to-server)

```ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/routers';

export const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://api:3000/trpc', headers: { 'x-api-key': process.env.API_KEY! } })]
});

// Usage
const user = await client.user.getById.query({ id: 'uuid' });
```

------

## Subscriptions (WebSocket)

```ts
// server/ws.ts
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from '@/routers';
import { createContext } from '@/trpc';

const wss = new WebSocketServer({ port: 3001 });
applyWSSHandler({ wss, router: appRouter, createContext });
// router with subscription
import { observable } from '@trpc/server/observable';
export const eventsRouter = router({
  counter: publicProcedure.subscription(() =>
    observable<number>((emit) => {
      let i = 0;
      const t = setInterval(() => emit.next(++i), 1000);
      return () => clearInterval(t);
    })
  ),
});
// client link
import { createWSClient, wsLink } from '@trpc/client';
const wsClient = createWSClient({ url: 'ws://localhost:3001' });
trpc.createClient({ links: [wsLink({ client: wsClient })] });
```

**Params of interest**

- `applyWSSHandler({ wss, router, createContext })`: binds tRPC to an existing `ws` server.
- `observable((emit) => { emit.next(x); return cleanup; })`: push values to subscribers.

------

## Middleware examples

### Auth gate (we already used `authedProcedure`)

```ts
const isAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
  return next();
});
export const adminProcedure = t.procedure.use(isAdmin);
```

### Logging + timing

```ts
const loggerMw = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const res = await next();
  console.log(`${type} ${path} took ${Date.now() - start}ms`, res.ok ? '' : res.error);
  return res;
});
export const loggedProcedure = t.procedure.use(loggerMw);
```

### Rate limit (token bucket sketch)

```ts
const rateLimit = t.middleware(({ ctx, next }) => {
  if (!ctx.rateLimiter?.allow(ctx.user?.id ?? ctx.ip))
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' as any, message: 'Slow down' });
  return next();
});
```

------

## Server-to-server calls (no HTTP, typed)

```ts
// Anywhere on the server (jobs/cron/controllers)
import { appRouter } from '@/routers';
import { createContext } from '@/trpc';

const caller = appRouter.createCaller(await createContext({ req: fakeReqWithAdminUser }));
await caller.post.create({ title: 'Hello', body: 'From job' });
```

**Why**: share the same validation & logic; no network hop; still fully typed.

------

## Error handling

```ts
throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid state' });
// In client (React Query): error shape under `err.data.code` / `err.message`
```

**Typical codes**

- `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `PRECONDITION_FAILED`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`.

------

## Caching & invalidation (React Query)

- Queries: `useQuery` (keys derived from procedure + input).
- Mutations: `useMutation` → `queryClient.invalidateQueries(trpc.post.list.getQueryKey())`.
- For cursor pagination, use **infinite queries** + `getNextPageParam`.

------

## File uploads?

tRPC doesn’t magically stream files; use **HTTP upload** (e.g., signed S3 URL) and send metadata via tRPC. There are community links for multipart, but the common prod pattern is **upload → notify**.

------

## Security checklist

- Validate **all inputs** with Zod; clamp limits.
- Enforce **auth** via middleware; check row-level ownership in DB calls.
- Add **rate limiting** per user/IP. For WS subscriptions, bound fan-out and payload sizes.
- Use `superjson` for consistent serialization and no surprises with Dates.
- Don’t leak sensitive errors; map to `TRPCError` with safe messages.

------

## Testing (unit & integration)

### Unit via `createCaller`

```ts
const caller = appRouter.createCaller({ user: { id:'u1' }, db: fakeDb });
await expect(caller.user.getById({ id: 'bad' })).rejects.toThrow();
```

### Integration over HTTP (Supertest)

```ts
import request from 'supertest';
it('creates post', async () => {
  const res = await request(app).post('/trpc/post.create')
    .set('authorization','Bearer test.jwt')
    .send({ input: { title:'T', body:'B' } })
    .expect(200);
  expect(res.body.result.data.title).toBe('T');
});
```

------

## When to choose (and not)

- **Choose tRPC**: Internal apps/monorepos where both ends are TS; want rapid iteration; React frontend.
- **Not ideal**: Public APIs, multiple languages, or when you need GraphQL’s **flexible querying**/federation.

------

## ✅ Interview Tips

- Define **router/procedure/context/middleware** clearly.
- Show **Zod** validation and `TRPCError` usage.
- Mention **React Query** integration and **httpBatchLink** headers for auth.
- For background jobs, cite **`createCaller`** to reuse business logic.
- Note **subscriptions via WS** and `observable`.
- Contrast with REST/GraphQL and when you’d pick each.

------

Want me to continue with **grpc-quickstart.md** next?