**worker-threads-vs-cluster.md**

# Worker Threads vs Cluster (CPU parallelism & multi-process scaling)

## 📌 What & why

- **Worker Threads**: multiple **threads** inside one Node **process**, each with its **own event loop**. Best for **CPU-bound** work (e.g., hashing, image/video/CSV crunching) that would block the main thread. Communicate by **messages**, **Transferable** `ArrayBuffer`s, or **SharedArrayBuffer**.
- **Cluster**: spawn multiple **processes** (one per CPU core typically). Each has its **own memory & event loop** and listens on the same port (via the primary process) or different ports behind a load balancer. Best for **scaling I/O-bound servers** across cores.

> Rule of thumb: **CPU-bound task? → Worker Threads.**
>  **More server throughput across cores? → Cluster (or run multiple processes via PM2/systemd/k8s).**

------

## Worker Threads (API you’ll actually use)

### Install?

Built-in: `node:worker_threads`.

### Creating a worker (ESM-friendly)

```ts
// hash-worker.ts (the worker file)
import { parentPort, workerData } from 'node:worker_threads';
import { pbkdf2Sync } from 'node:crypto';

const { password, iterations } = workerData;
const out = pbkdf2Sync(password, 'salt', iterations, 32, 'sha256').toString('hex');
parentPort!.postMessage({ ok: true, hash: out });
// hash.ts (main thread)
import { Worker } from 'node:worker_threads';

export function hashPassword(password: string, iterations = 150_000) {
  return new Promise<{hash: string}>((resolve, reject) => {
    const w = new Worker(new URL('./hash-worker.ts', import.meta.url), {
      workerData: { password, iterations }
    });
    w.once('message', (msg) => resolve({ hash: msg.hash }));
    w.once('error', reject);
    w.once('exit', (code) => code && reject(new Error('worker_exit ' + code)));
  });
}
```

**Key args/params**

- `new Worker(filenameOrURL, { workerData, execArgv, resourceLimits, stdout, stderr, transferList })`
  - `workerData`: small JSON to initialize work.
  - `resourceLimits`: `{ maxOldGenerationSizeMb, maxYoungGenerationSizeMb, stackSizeMb }`.
  - `transferList`: **move** ownership of `ArrayBuffer`s to avoid copying (zero-copy).
- Worker methods: `.postMessage(value, transferList?)`, `.terminate()`, events: `'message'|'error'|'exit'`.

### Transfer large data efficiently (zero-copy)

```ts
// main
const buf = new ArrayBuffer(1024 * 1024);
const w = new Worker(new URL('./image-worker.js', import.meta.url));
w.postMessage({ buf }, [buf]); // ownership transfers to the worker
```

*Use `SharedArrayBuffer + Atomics` if both sides must access concurrently.*

### A tiny worker pool (re-usable threads)

```ts
// worker-pool.ts
import { Worker } from 'node:worker_threads';
const SIZE = Math.max(1, Math.min(4, require('node:os').cpus().length - 1));

export class Pool {
  private idle: Worker[] = [];
  private queue: ((w: Worker) => void)[] = [];

  constructor(private script: URL) {
    for (let i=0;i<SIZE;i++) this.idle.push(new Worker(script));
  }

  run<T, R>(data: T): Promise<R> {
    return new Promise((res, rej) => {
      const exec = (w: Worker) => {
        const done = () => this.idle.push(w) && this.dequeue();
        const onMsg = (m: any) => (cleanup(), res(m));
        const onErr = (e: any) => (cleanup(), rej(e));
        const cleanup = () => { w.off('message', onMsg); w.off('error', onErr); done(); };
        w.once('message', onMsg);
        w.once('error', onErr);
        w.postMessage(data);
      };
      this.idle.length ? exec(this.idle.pop()!) : this.queue.push(exec);
    });
  }

  private dequeue() { const next = this.queue.shift(); if (next && this.idle.length) next(this.idle.pop()!); }
  async close() { await Promise.all(this.idle.map(w => w.terminate())); }
}
```

*Cap pool size to **CPU cores**. Use a queue to avoid spawning too many workers.*

### Good use cases

- Hashing, compression, image/video transforms
- CSV/JSON parsing at scale
- CPU-heavy data transforms (ML inference without GPU, scoring, etc.)

**Gotchas**

- Don’t spawn per-request workers; **pool** them.
- Each worker has memory overhead; watch total RSS.
- Avoid sending giant objects by copy—**Transfer** buffers.

------

## Cluster (multi-process HTTP scaling)

### When to use

- You want one Node **per core** to handle more concurrent I/O.
- You’re not on k8s/PM2, or you want built-in master/worker orchestration.
- You have **stateful** in-memory caches per worker (OK), while shared state goes to Redis/DB.

### Basic cluster server (ESM)

```ts
// server-cluster.ts
import cluster from 'node:cluster';
import os from 'node:os';
import http from 'node:http';

const num = process.env.WEB_CONCURRENCY ? Number(process.env.WEB_CONCURRENCY) : os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} starting ${num} workers`);
  for (let i=0; i<num; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} died (${signal || code}), restarting…`);
    cluster.fork();
  });
} else {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') return void res.end('ok');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ pid: process.pid, path: req.url }));
  });

  server.listen(process.env.PORT || 3000, () => {
    console.log(`Worker ${process.pid} listening`);
  });
}
```

**Key APIs/params**

- `cluster.isPrimary` / `cluster.isWorker`
- `cluster.fork(env?)` → returns `Worker`
- `cluster.on('exit', handler)` to **respawn** on crash
- `worker.process.pid`, `worker.send()` / `process.on('message')` for IPC
- `cluster.setupPrimary({ exec, args, silent })` (advanced)

### Sticky sessions (WebSockets)

- TCP load is distributed per request; WebSockets need **sticky** routing to keep the same worker.
- Solutions:
  - Put sticky load balancer in front (Nginx/ELB sticky).
  - Or implement sticky inside primary with a hash on `remoteAddress`. Libraries like `sticky-session` exist, but honestly, **use a proxy**.

### Graceful shutdown (don’t drop traffic)

```ts
process.on('SIGTERM', () => {
  server.close(() => process.exit(0)); // stop accepting new, let in-flight finish
  setTimeout(() => process.exit(1), 10_000).unref();
});
```

**Gotchas**

- Each worker duplicates **connection pools** (DB/Redis). Keep pool sizes low (e.g., 10 per worker) to avoid DB overload.
- Memory multiplies per worker; watch container limits.
- In containers/k8s, it’s often cleaner to run **1 process = 1 core per pod** and scale **horizontally** instead of using cluster.

------

## Worker vs Cluster — quick compare

| Dimension            | Worker Threads                                 | Cluster (Processes)                                       |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| Isolation            | Shared process, separate threads               | Full process isolation                                    |
| Ideal for            | **CPU-bound** tasks                            | **I/O-bound** HTTP scaling                                |
| Memory               | Lower overhead per unit                        | Higher (full heap per process)                            |
| Data sharing         | Via messages, Transferables, SharedArrayBuffer | IPC messages only (copy)                                  |
| Failure blast radius | A crash can take whole process                 | Worker crash isolated; primary respawns                   |
| Ports                | Same process                                   | One listener coordinated by primary (or per-process port) |
| Dev ergonomics       | Requires worker files, pool mgmt               | Simple to fork N workers                                  |

------

## Real-world patterns

### Offload CPU inside API (don’t block)

```ts
// route: POST /hash
app.post('/hash', async (req, res, next) => {
  try {
    const { hash } = await pool.run({ password: req.body.password, iterations: 150_000 });
    res.json({ hash });
  } catch (e) { next(e); }
});
```

### Hybrid: cluster for HTTP + worker pool inside each worker

- Use **cluster** (or k8s/PM2) to run N server processes.
- Inside each, keep a small **Worker Threads pool** for CPU jobs.

### Alternative: move CPU to a **separate service**

- Extract CPU-heavy work behind a queue (BullMQ) or RPC.
- Keeps API latency predictable; workers scale independently.

------

## Performance & ops tips

- **Measure**: event loop delay (perf_hooks) and p95 latency before/after.
- **Pool sizes**: `min(cores, 4–8)` for Workers; for cluster, start with `os.cpus().length`.
- **DB pools**: lower per-process pool when clustering (e.g., 5–10 per worker).
- **Logging**: include `pid`/`reqId` in logs to debug per-worker issues.
- **Heartbeat**: primary can `worker.send('ping')` and replace unresponsive workers.

------

## Common pitfalls (and fixes)

- Spawning a **worker per request** → 🐌 memory/CPU churn. *Use a pool.*
- Passing huge objects by value → copy overhead. *Transfer `ArrayBuffer`s.*
- Forgetting **graceful shutdown** → dropped requests on deploys. *Call `server.close()`.*
- Cluster + websockets without stickiness → broken connections. *Use sticky LB.*
- Over-provisioned DB pools across workers → DB thrash. *Tune down per worker.*

------

## ✅ Interview Tips

- Define **why Worker Threads** (CPU-bound) vs **why Cluster** (multi-core HTTP).
- Mention **Transferable** buffers and **SharedArrayBuffer** for worker perf.
- Show a **worker pool** snippet and **graceful shutdown** for cluster.
- Call out **DB pool tuning** and **sticky sessions** for WS.
- In containerized envs, say you prefer **one process per container and scale out**, reserving cluster for VM setups.

------

Want to continue with **redis-caching.md** (already covered) or move to **queues-bullmq.md** (done) and then **11-devtools-and-debugging/node-inspect-and-devtools.md**?