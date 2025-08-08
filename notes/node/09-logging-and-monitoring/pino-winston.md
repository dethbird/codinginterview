**pino-winston.md**

# Pino & Winston (structured logging for Node)

## 📌 What & why

- **Pino**: super-fast JSON logger. Best for **structured logs**, high-throughput services, containers/K8s (log to **stdout**).
- **Winston**: flexible logger with many **transports** (files, HTTP, CloudWatch, etc.). Slower than Pino but very configurable.

> Interview line: “In prod I log **structured JSON** to stdout and let the platform ship/rotate logs. Pino for speed; Winston when I need pluggable transports.”

------

## Pino — fast, structured by default

### Install

```bash
npm i pino pino-pretty             # pretty is dev-only
npm i pino-http                    # optional: HTTP middleware
```

### Basic usage (args that matter)

```ts
import pino from 'pino';

export const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',   // 'fatal','error','warn','info','debug','trace'
  base: { service: 'api' },                 // fields added to every log
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
});

// Examples
log.info({ userId: 'u_1' }, 'user logged in'); // message + structured fields
log.error({ err }, 'failed to save');          // if err is Error, Pino serializes stack
```

**Key options**

- `level`: minimum level to emit.
- `base`: static fields (service/version/env).
- `transport`: dev-time pretty printing; **omit in prod** (keep pure JSON).
- `redact`: mask sensitive paths (see below).

### Redaction (hide secrets safely)

```ts
const log = pino({
  redact: {
    paths: ['password', 'token', 'headers.authorization'],
    censor: '[redacted]'            // or true to remove field
  }
});
```

### Child loggers (add context once)

```ts
const logOrder = log.child({ module: 'orders' });
logOrder.info({ orderId: 'o_123' }, 'created order');
```

### HTTP logging (Express)

```ts
import pinoHttp from 'pino-http';
import express from 'express';
import { randomUUID } from 'node:crypto';

const app = express();

app.use((req, _res, next) => { req.id = randomUUID(); next(); });

app.use(pinoHttp({
  logger: log,
  customLogLevel: (req, res, err) => err ? 'error' : res.statusCode >= 500 ? 'error'
                                        : res.statusCode >= 400 ? 'warn' : 'info',
  customProps: (req) => ({ reqId: req.id }),
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url }; },
    res(res) { return { statusCode: res.statusCode }; }
  }
}));

app.get('/health', (_req, res) => res.json({ ok: true }));
```

### AsyncLocalStorage (correlate logs by request)

```ts
import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage<{ reqId: string }>();

export function withReqContext(reqId: string, fn: () => Promise<any>) {
  return als.run({ reqId }, fn);
}
export const log = pino({ mixin() { return als.getStore() ?? {}; } });
// Every log now includes { reqId } if set.
```

### Sampling noisy logs

```ts
const log = pino({
  level: 'info',
  hooks: {
    logMethod(args, method) {
      // drop some debug logs (e.g., 90%) to reduce noise
      if (args[1]?.startsWith('verbose thing') && Math.random() < 0.9) return;
      method.apply(this, args);
    }
  }
});
```

**Prod tips**

- Log to **stdout**; no file rotation in app code.
- Keep messages short + fields explicit; avoid dumping huge objects.
- Include `reqId`, `userId`, `orgId`, `route`, and **duration** for ops value.

------

## Winston — flexible transports & formats

### Install

```bash
npm i winston
```

### Basic config (transports & formats)

```ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.json(),               // JSON for prod
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.Console(),          // stdout
    // new winston.transports.File({ filename: 'app.log' }) // not ideal in containers
  ]
});

// Human-readable for local dev:
if (process.env.NODE_ENV !== 'production') {
  logger.format = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) =>
      `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`)
  );
}

logger.info('server started', { port: 3000 });
```

**Core pieces**

- **Transports**: where logs go (`Console`, `File`, HTTP, 3rd party).
- **Formats**: `json()`, `timestamp()`, `printf()` for custom lines, `combine()`.
- **Levels**: same idea as Pino; set via `level`.

### Child loggers / meta

```ts
const logUser = logger.child({ module: 'user' });
logUser.warn('quota low', { userId: 'u_1' });
```

### Redaction (manual or via format)

```ts
const redact = winston.format((info) => {
  if (info.password) info.password = '[redacted]';
  return info;
});
logger.format = winston.format.combine(redact(), winston.format.json());
```

------

## Choosing & integrating (real-world guidance)

- **Default choice**: **Pino** (fast, JSON, plays great with ELK/OpenSearch/Datadog). Use `pino-http` + `AsyncLocalStorage` for request correlation.
- **Need multiple outputs** (e.g., console + HTTP endpoint + custom file)? **Winston** is simpler out of the box with **transports**.
- **Don’t pretty-print in prod**. Pretty is for local dev only.
- **Cloud-native**: stdout JSON → collector (Fluent Bit, Vector, CloudWatch agent). Add labels via container metadata.

------

## Structured fields you’ll copy-paste

- Common base: `{ service, env, version, hostname }`
- Per-request: `{ reqId, userId, ip, method, url, route, statusCode, duration_ms }`
- Domain: `{ orderId, invoiceId, orgId }`
- Errors: `{ err: error }` (Pino auto-serializes stack; Winston you format it)

**Timing util**

```ts
function time<T>(log: any, msg: string, ctx: Record<string, any> = {}) {
  const start = Date.now();
  return async (p: Promise<T>) => {
    try { return await p; }
    finally { log.info({ ...ctx, duration_ms: Date.now() - start }, msg); }
  };
}
// Usage: await time(log, 'processed export', { exportId })(doWork());
```

------

## Express error handler (consistent error logs)

```ts
app.use((err, req, res, _next) => {
  req.log?.error({ err, reqId: req.id }, 'unhandled error');     // pino-http attaches req.log
  const status = err.status ?? 500;
  res.status(status).json({ error: status === 500 ? 'internal_error' : err.code || 'bad_request' });
});
```

------

## Interop with OpenTelemetry (tie logs to traces)

- Add trace/span ids to logs so you can pivot in your APM:

```ts
import { context, trace } from '@opentelemetry/api';
const log = pino({ mixin() {
  const span = trace.getSpan(context.active());
  const spanCtx = span?.spanContext();
  return spanCtx ? { trace_id: spanCtx.traceId, span_id: spanCtx.spanId } : {};
}});
```

------

## ✅ Interview Tips

- Say “**structured JSON** to stdout; ship/parse later.”
- Show Pino with `redact`, child loggers, and `pino-http` + AsyncLocalStorage for request IDs.
- Explain Winston’s **transports** vs Pino’s speed; when you’d pick each.
- Mention **error serialization**, **log levels**, and **don’t pretty-print in prod**.
- Include correlation IDs and (bonus) trace ids for cross-tool debugging.

------

Next: **http-logging-morgan.md** or jump to **metrics-prometheus.md**?