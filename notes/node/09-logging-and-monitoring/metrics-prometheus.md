**metrics-prometheus.md**

# Prometheus Metrics (with `prom-client` + Express)

## 📌 What & why

**Prometheus** scrapes your app’s `/metrics` endpoint and stores **time-series**. You visualize/alert with **Grafana** or Alertmanager rules. In Node, use **`prom-client`** to expose **Counters, Gauges, Histograms, Summaries**.
 Rule of thumb: instrument the **RED** metrics (Rate, Errors, Duration) for HTTP and key dependencies (DB, queue, cache).

------

## Install & quick start

```bash
npm i prom-client
// metrics.ts
import express from 'express';
import {
  Registry, collectDefaultMetrics,
  Counter, Gauge, Histogram
} from 'prom-client';

export const metricsApp = express();
export const register = new Registry();

// Default runtime/process metrics (CPU, mem, event loop, GC)
collectDefaultMetrics({
  register,
  prefix: 'app_',                      // namespacing
  gcDurationBuckets: [0.001,0.01,0.1,1] // seconds
});

// Custom RED metrics
export const httpRequests = new Counter({
  name: 'app_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method','route','status'] as const,
  registers: [register]
});

export const httpDuration = new Histogram({
  name: 'app_http_request_duration_seconds',
  help: 'HTTP latency',
  labelNames: ['method','route','status'] as const,
  // SLO-aware buckets (seconds). Tune for your latency SLOs.
  buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5,10],
  registers: [register]
});

export const inFlight = new Gauge({
  name: 'app_http_in_flight_requests',
  help: 'Concurrent requests',
  registers: [register]
});

// Expose /metrics (no auth here; restrict by network/ingress)
metricsApp.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

------

## Express integration middleware (real-world)

```ts
// app.ts
import express from 'express';
import { httpRequests, httpDuration, inFlight } from './metrics';

export const app = express();

app.use((req, res, next) => {
  inFlight.inc();

  const start = process.hrtime.bigint();
  // Finish hook runs after route
  res.on('finish', () => {
    inFlight.dec();
    // Get normalized route ("/users/:id") if available
    const route = (req.route?.path || (req as any).matchedRoute || req.path || 'unknown').toString();
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode)
    };

    httpRequests.inc(labels);

    const durSec = Number((process.hrtime.bigint() - start)) / 1e9;
    httpDuration.observe(labels, durSec);
  });

  next();
});

// Optional: a wrapper to set (req as any).matchedRoute in routers
// so we log param patterns instead of concrete values.
```

> **Why labels?** They let you slice: `rate(app_http_requests_total{route="/users/:id",status="500"}[5m])`.
>  **Watch cardinality**: keep label values bounded (method/status/route OK; userId/URL query BAD).

------

## Instrumenting dependencies (DB/Redis/HTTP)

### Postgres query latency

```ts
import { Histogram } from 'prom-client';
export const dbDuration = new Histogram({
  name: 'app_db_query_duration_seconds',
  help: 'DB query latency',
  labelNames: ['op','table','success'] as const,
  buckets: [0.001,0.005,0.01,0.025,0.05,0.1,0.25,0.5,1],
  registers: [register]
});

export async function timedQuery<T>(op: string, table: string, run: () => Promise<T>) {
  const end = dbDuration.startTimer({ op, table });
  try { const r = await run(); end({ success: 'true' }); return r; }
  catch (e) { end({ success: 'false' }); throw e; }
}
```

### Redis cache hit rate

```ts
export const cacheHits = new Counter({
  name: 'app_cache_hits_total', help: 'Cache hits', registers: [register]
});
export const cacheMisses = new Counter({
  name: 'app_cache_misses_total', help: 'Cache misses', registers: [register]
});

// later:
if (cached) cacheHits.inc(); else cacheMisses.inc();
```

### Queue depth (BullMQ)

```ts
import { Gauge } from 'prom-client';
export const jobsWaiting = new Gauge({
  name: 'app_jobs_waiting', help: 'Jobs waiting', registers: [register], labelNames: ['queue'] as const
});

// scrape periodically
setInterval(async () => {
  jobsWaiting.set({ queue: 'emails' }, await emailQueue.getWaitingCount());
}, 10_000).unref();
```

------

## Histograms vs Summaries (when to use)

- **Histogram**: server-side buckets; you can compute **aggregates (p90/p99)** across instances in Prometheus (`histogram_quantile`). **Use this by default.**
- **Summary**: client-side quantiles; cannot aggregate across instances. Use only when **per-pod quantile** is enough.

**Example query (Grafana/PromQL):**

```promql
sum(rate(app_http_request_duration_seconds_bucket{route="/api"}[5m])) by (le)
|> histogram_quantile(0.95, __)
```

------

## Multi-registry (optional)

If you need **separate registries** (e.g., public `/metrics` vs internal admin), create multiple `Registry` instances and wire different endpoints. Most apps stick to a single `register`.

------

## Scrape endpoint & security

- Expose `/metrics` on your **internal network** only (ingress allowlist, Basic auth at proxy, or bind to localhost).
- The endpoint returns plaintext in Prometheus format; **no PII or secrets** in labels/values.

------

## Example: mount metrics server

```ts
// server.ts
import http from 'node:http';
import { app } from './app';
import { metricsApp } from './metrics';

http.createServer(app).listen(3000);
http.createServer(metricsApp).listen(9090); // scrape this one
```

> Splitting ports avoids auth/CORS middleware interfering with scraping.

------

## Useful application SLOs & alerts (copy ideas)

- **Availability**: `5xx rate` > X% for Y minutes on a route.
- **Latency**: `p95 app_http_request_duration_seconds` > SLO for N minutes.
- **Saturation**: `app_http_in_flight_requests` near instance concurrency limit.
- **Errors by dependency**: `app_db_query_duration_seconds_count{success="false"}` rate.

------

## Common pitfalls

- **High-cardinality labels** (userId, URL with query) → RAM explosion. Keep labels bounded.
- **Too few histogram buckets** → quantiles become inaccurate. Start with SLO-based buckets.
- **Double-counting** `/metrics` or health checks → use middleware `skip` or separate server.
- **Blocking the event loop** in metrics collectors → keep collectors lightweight; use `setInterval(...).unref()`.

------

## Minimal Prometheus scrape config (ops note)

```yaml
scrape_configs:
  - job_name: 'my-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['my-api:9090']
```

------

## ✅ Interview Tips

- Explain **RED**: request **Rate**, **Errors**, **Duration** and how you instrument each with `prom-client`.
- Prefer **Histograms** (cluster-aggregatable); talk **bucket tuning** from SLOs.
- Warn about **label cardinality** and keeping `/metrics` internal.
- Mention **default metrics** (GC, event loop), and adding **dependency metrics** (DB/cache/queue).
- Describe a **p95 latency** PromQL using `histogram_quantile`.

------

Next: **tracing-opentelemetry.md**?