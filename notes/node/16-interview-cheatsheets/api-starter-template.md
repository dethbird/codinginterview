**api-starter-template.md**

# API Starter Template (Node + TypeScript + Express)

> A sane, copy-pasteable skeleton you can stand up in minutes during an interview or for a real backend. Includes **typed config**, **logging**, **routing**, **errors**, **security headers**, **health checks**, **testing**, and **graceful shutdown**.

------

## Folder layout (drop this in your repo)

```
src/
  config/
    index.ts              # zod-validated env config
  logger.ts               # pino logger
  web/
    http/
      errors.ts           # AppError + helpers
      middleware.ts       # CORS, security, asyncHandler, requestId, errorHandler
      routes.ts           # v1 routes
      controllers/
        health.controller.ts
        users.controller.ts
  server.ts               # create/start HTTP server (graceful shutdown)
tests/
  health.test.ts          # supertest example
.env.example
tsconfig.json
```

------

## package.json (scripts you’ll actually use)

```jsonc
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    "test": "vitest",
    "test:cov": "vitest run --coverage",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.19.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "pino": "^9.0.0",
    "pino-http": "^10.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.16.0",
    "vitest": "^2.0.0",
    "supertest": "^7.0.0",
    "eslint": "^9.0.0",
    "@types/express": "^4.17.21"
  }
}
```

------

## tsconfig.json (ESM + sourcemaps)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": false,
    "outDir": "dist",
    "sourceMap": true,
    "inlineSources": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"]
}
```

------

## .env.example (document required vars)

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
# Add DB/Redis/etc as needed:
# DATABASE_URL=postgres://user:pass@localhost:5432/app
```

------

## src/config/index.ts — **typed env** (Zod)

```ts
// src/config/index.ts
import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
  // DATABASE_URL: z.string().url().optional(), // uncomment when needed
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid env:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = Object.freeze({
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  logLevel: parsed.data.LOG_LEVEL
});
```

**Why:** centralizes `process.env`, coerces strings→numbers, **fails fast** with clear errors.

------

## src/logger.ts — **pino** (fast JSON logs)

```ts
// src/logger.ts
import pino from 'pino';
import { config } from '@/config';

export const log = pino({
  level: config.logLevel,
  redact: { paths: ['req.headers.authorization', '*.password', '*.token'], censor: '[REDACTED]' }
});
```

**Args:** `level` controls verbosity; `redact` prevents leaking secrets.

------

## src/web/http/errors.ts — **AppError** + helpers

```ts
// src/web/http/errors.ts
export type ErrorCode =
  | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND'
  | 'CONFLICT' | 'UNPROCESSABLE' | 'RATE_LIMITED' | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public http = 400,
    public details?: Record<string, unknown>,
    cause?: unknown
  ) {
    super(code); if (cause) (this as any).cause = cause;
  }
}

export class NotFound extends AppError { constructor(msg='not_found', d?: any){ super('NOT_FOUND', 404, d); } }
export class Forbidden extends AppError { constructor(msg='forbidden', d?: any){ super('FORBIDDEN', 403, d); } }
```

**Use:** throw `new NotFound()` in controllers/use-cases; map once in error middleware.

------

## src/web/http/middleware.ts — core middleware

```ts
// src/web/http/middleware.ts
import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { log } from '@/logger';
import { AppError } from './errors';
import crypto from 'node:crypto';

export const security = [helmet()];

export const corsMw = cors({
  origin: (origin, cb) => cb(null, !origin || ['http://localhost:5173'].includes(origin)), // allowlist
  credentials: true
});

export const loggerMw = pinoHttp({
  logger: log,
  genReqId: () => crypto.randomUUID() // requestId for correlation
});

export const asyncHandler =
  <T extends any[]>(fn: (...args: T) => Promise<any>) =>
  (...args: T) => fn(...args).catch(args[2] as NextFunction);

export const notFound = (_req: Request, res: Response) =>
  res.status(404).json({ title: 'NOT_FOUND', status: 404, detail: 'route_not_found' });

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isApp = err instanceof AppError;
  const http = isApp ? err.http : 500;
  const body = {
    title: isApp ? err.code : 'INTERNAL',
    status: http,
    detail: isApp ? err.message : 'internal_error',
    requestId: (req as any).id || (req as any).id || undefined,
    ...(isApp && err.details ? { details: err.details } : {})
  };
  (req as any).log?.error({ err, code: body.title }, 'request_error');
  res.status(http).json(body);
};
```

**Notes:** `helmet()` adds security headers; `cors` allowlists origins; `pino-http` logs with `reqId`.

------

## Controllers & routes

### src/web/http/controllers/health.controller.ts

```ts
import type { Request, Response } from 'express';
export const getHealth = (_req: Request, res: Response) => res.json({ ok: true });
```

### src/web/http/controllers/users.controller.ts (example)

```ts
import type { Request, Response } from 'express';
import { AppError } from '../errors';

// Pretend store
const users = new Map<string, { id: string; email: string }>();

export async function postUser(req: Request, res: Response) {
  const email = String(req.body?.email || '').trim();
  if (!/^\S+@\S+$/.test(email)) throw new AppError('UNPROCESSABLE', 422, { email: 'invalid' });
  const id = crypto.randomUUID();
  users.set(id, { id, email });
  res.status(201).json({ id, email });
}

export async function getUser(req: Request, res: Response) {
  const u = users.get(req.params.id);
  if (!u) throw new AppError('NOT_FOUND', 404, { id: req.params.id });
  res.json(u);
}
```

### src/web/http/routes.ts

```ts
import { Router } from 'express';
import { asyncHandler } from './middleware';
import { getHealth } from './controllers/health.controller';
import { getUser, postUser } from './controllers/users.controller';

export function routes() {
  const r = Router();
  r.get('/health', getHealth);
  r.post('/v1/users', asyncHandler(postUser));
  r.get('/v1/users/:id', asyncHandler(getUser));
  return r;
}
```

------

## src/server.ts — **compose app + graceful shutdown**

```ts
import express from 'express';
import { config } from '@/config';
import { security, corsMw, loggerMw, notFound, errorHandler } from '@/web/http/middleware';
import { routes } from '@/web/http/routes';

const app = express();
app.use(loggerMw);
app.use(security);
app.use(corsMw);
app.use(express.json({ limit: '1mb' }));

app.use('/', routes());
app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`listening on :${config.port}`);
});

// Graceful shutdown
['SIGINT','SIGTERM'].forEach(sig => {
  process.on(sig, () => {
    console.log(`${sig} received, closing…`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
});

export { app };
```

**Args to note:** `express.json({ limit })` bounds body size; error handler must be **last**.

------

## tests/health.test.ts — Supertest + Vitest

```ts
import request from 'supertest';
import { app } from '@/server';

it('GET /health', async () => {
  const res = await request(app).get('/health').expect(200);
  expect(res.body.ok).toBe(true);
});
```

**Tip:** Export the `app` (don’t `.listen()` inside tests). Run with `vitest`.

------

## Minimal Dockerfile (multi-stage)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --chown=node:node package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY --chown=node:node --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node","dist/server.js"]
```

**Why these args:** final image has only prod deps + built JS; non-root `USER node`; healthcheck wires into orchestrators.

------

## Security & ops toggles (quick wins)

- **Rate limit:** add `express-rate-limit` (e.g., `100 req/min/IP`).
- **CORS allowlist:** use a function to validate `Origin`.
- **Logging:** include `reqId`, `userId` (if authenticated) in logs for correlation.
- **Timeouts:** when calling upstreams, wrap with `AbortController` (see `quick-snippets.md`).

------

## Ready-made sound bites (interview)

- “I start with **typed env** (Zod), **pino** logs, CORS+**helmet**, and a **central error middleware** (Problem-Details-ish).”
- “Routes are wrapped with an **async handler**; I add **health** + **graceful SIGTERM** for clean deploys.”
- “I cap JSON body size (`1mb`), set a CORS **allowlist**, and redact secrets from logs.”

------

Want me to generate a **zip** with these files scaffolded, or move on to the next outline item?