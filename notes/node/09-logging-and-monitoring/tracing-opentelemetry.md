**tracing-opentelemetry.md**

# Tracing with OpenTelemetry (Node.js)

## 📌 What & why

**OpenTelemetry (OTel)** provides **vendor-neutral** APIs/SDKs to collect **traces** (and metrics/logs). Traces show **end-to-end request paths** across services (HTTP → DB → queue → worker), with timing and errors. You export them to **Jaeger/Tempo/OTel Collector/Honeycomb/Datadog/New Relic**, etc.

> Interview line: “I auto-instrument HTTP/Express/DB with OTel, set a **sample rate** (e.g., 10%), and add **manual spans** for business steps. I propagate context over HTTP headers and into queues so I can follow a request across services.”

------

## Install (Node SDK + common instrumentations)

```bash
npm i @opentelemetry/api @opentelemetry/sdk-node \
      @opentelemetry/auto-instrumentations-node \
      @opentelemetry/exporter-trace-otlp-http \
      @opentelemetry/resources @opentelemetry/semantic-conventions
# Optional instrumentations come via the auto bundle: http, express, pg, mysql2, mongodb, redis, fastify, etc.
```

------

## Bootstrapping the SDK (load **before** your app)

```ts
// tracing.ts (load with: node -r ./dist/tracing.js dist/server.js)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator, W3CBaggagePropagator } from '@opentelemetry/core';

const exporter = new OTLPTraceExporter({
  // Default OTLP HTTP endpoint (Collector/Tempo/Jaeger OTEL): http://host:4318/v1/traces
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  // Optional: auth headers for SaaS backends
  // headers: { 'x-honeycomb-team': process.env.HONEYCOMB_KEY! }
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'api',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.APP_VERSION || 'dev',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: exporter,                          // Batch span processor is added automatically
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? 0.1)), // 10% sample
  }),
  textMapPropagator: new W3CTraceContextPropagator(), // + baggage if you use it:
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable/disable per lib & add options if needed:
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis-4': { enabled: true },
    }),
  ],
});

sdk.start();
process.on('SIGTERM', async () => { await sdk.shutdown(); process.exit(0); });
```

**Key arguments**

- `traceExporter`: where traces go (OTLP HTTP is the easiest; gRPC exporter also exists).
- `sampler`: `ParentBased(TraceIdRatioBased(p))` for global sample rate; `AlwaysOn` for debugging.
- `resource`: **service.name**, **service.version**, **deployment.environment**.
- `instrumentations`: auto-patch libs to create spans (HTTP, DB, etc.).
- `textMapPropagator`: keep **W3C tracecontext** so other services understand you.

------

## Running with preload

Ensure tracing loads **before** app imports:

```json
// package.json
{
  "scripts": {
    "start": "node -r ./dist/tracing.js dist/server.js",
    "dev": "tsx -r ./src/tracing.ts src/server.ts"
  }
}
```

------

## Manual spans (business steps you care about)

```ts
// services/orders.ts
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
const tracer = trace.getTracer('orders');

export async function createOrder(userId: string, items: any[]) {
  return await tracer.startActiveSpan('orders.create', { attributes: { 'app.user_id': userId } }, async (span) => {
    try {
      await reserveInventory(items);                      // your function
      const orderId = await writeOrderToDb(userId, items);
      span.setAttribute('app.order_id', orderId);
      span.addEvent('order.persisted', { items: items.length });
      return orderId;
    } catch (e: any) {
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      throw e;
    } finally {
      span.end(); // required
    }
  });
}
```

**Notes**

- Use **semantic attributes** when available; otherwise prefix app ones (`app.*`).
- Add **events** for key milestones; set **status=ERROR** on failures.

------

## HTTP propagation (inject/extract)

### Inject current trace into outbound HTTP request

```ts
import { context, propagation } from '@opentelemetry/api';
import fetch from 'node-fetch';

export async function callPartner(url: string) {
  const headers: Record<string, string> = {};
  propagation.inject(context.active(), headers); // adds 'traceparent' (and 'baggage' if used)
  const res = await fetch(url, { headers });
  return res.json();
}
```

### Consume a message from a queue with preserved context

When you enqueue, **inject** headers into the payload. When consuming, **extract**:

```ts
// producer (enqueue)
import { propagation, context } from '@opentelemetry/api';
const carrier: Record<string, string> = {};
propagation.inject(context.active(), carrier);
await queue.add('email', { to, body, otel: carrier });

// consumer (worker)
import { trace, propagation, context as otCtx } from '@opentelemetry/api';
const tracer = trace.getTracer('worker');

queue.process('email', async (job) => {
  const parent = propagation.extract(otCtx.active(), job.data.otel || {});
  await otCtx.with(parent, async () => {
    const span = tracer.startSpan('email.send', { kind: 2 /* CONSUMER */ });
    try { await send(job.data); }
    catch (e) { span.recordException(e); span.setStatus({ code: 2 }); throw e; }
    finally { span.end(); }
  });
});
```

*If you don’t want parent/child semantics (fan-in), use **span links** instead of making the parent active.*

------

## Correlate logs with traces (Pino)

```ts
// pino-otel.ts
import pino from 'pino';
import { context, trace } from '@opentelemetry/api';

export const log = pino({
  mixin() {
    const span = trace.getSpan(context.active());
    const sc = span?.spanContext();
    return sc ? { trace_id: sc.traceId, span_id: sc.spanId } : {};
  }
});
```

*Now every log line during a request carries `trace_id`/`span_id`, so you can pivot between logs and traces.*

------

## Env vars you’ll actually use (no code changes)

- `OTEL_SERVICE_NAME=api`
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel-collector:4318/v1/traces`
- `OTEL_TRACES_SAMPLER=parentbased_traceidratio`
   `OTEL_TRACES_SAMPLER_ARG=0.1`  *(10% sample)*
- `OTEL_RESOURCE_ATTRIBUTES=service.version=1.2.3,deployment.environment=prod`
- `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer abc123` *(if your backend needs it)*

------

## Sampling strategy (quick guide)

- **Dev**: `AlwaysOn` for full visibility.
- **Prod**: `ParentBased(TraceIdRatio(p))` with `p` ≈ 0.05–0.20. Keep **errors** sampled since they’re downstream children of sampled roots; for guaranteed error sampling, you can implement a **tail sampler** in the **Collector**.
- High-traffic hot paths? Lower rate or add **sampler rules** per route.

------

## Common instrumentations (auto)

- `http`/`https`: inbound/outbound spans with status & duration
- `express`: names spans by route (`GET /users/:id`)
- `pg`, `mysql2`, `mongodb`, `redis`: DB spans with operation names and durations
- `@opentelemetry/instrumentation-fetch` (Node 18+): fetch client spans

**Tip:** Use **normalized routes** in labels/attributes to keep cardinality low (avoid raw URLs with IDs).

------

## Export paths (picking a backend)

- **OTel Collector** (recommended): your app → **Collector** (OTLP) → any backend. Lets you do **tail sampling**, filtering, retries, batching.
- Direct to **Tempo/Jaeger/Honeycomb/NewRelic/Datadog**: set `OTEL_EXPORTER_*` to their endpoint and auth header.

------

## Performance & ops tips

- The SDK uses a **BatchSpanProcessor** by default; spans are buffered & sent in batches — low overhead.
- If you see overhead on ultra-hot paths, **lower sample rate** or disable noisy instrumentations.
- **Shutdown** the SDK cleanly on process exit so buffered spans flush.
- Don’t put PII in attributes; traces are widely accessible in many orgs.

------

## Troubleshooting

- **No traces showing up**: check endpoint/headers, open `4318` in your network, enable debug logs: `OTEL_LOG_LEVEL=debug`.
- **Broken async context**: ensure you preload tracing **before** other imports; Node 16+ uses ALS; older versions may need `@opentelemetry/context-async-hooks`.
- **Too many spans**: tune instrumentations (disable chatty ones), adjust sample rate.
- **Route names are raw paths**: ensure Express instrumentation is enabled and your routers are set up before the middleware that finishes responses.

------

## ✅ Interview Tips

- Define **trace/span** and how **propagation** works (W3C `traceparent`).
- Explain **auto vs manual** instrumentation and when to add **business spans**.
- Mention **sampling** (ParentBased + ratio) and **Collector** for tail sampling.
- Show **context propagation** over HTTP and queues.
- Tie logs to traces by adding `trace_id`/`span_id` in log fields.

------

Want me to continue with **09-logging-and-monitoring/tracing-opentelemetry.md** follow-ups (advanced Collector config), or jump to the next section?