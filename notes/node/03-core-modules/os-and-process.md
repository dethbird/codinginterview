**os-and-process.md**

# OS & Process

## 📌 What & why

Node exposes **process-level** info (env, args, PID, signals) and **OS** details (CPUs, memory, tmpdir). You’ll use these for **configuration**, **graceful shutdown**, **health checks**, **resource sizing**, and **observability**.

------

## `process` essentials

### Environment variables

```js
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 3000);
if (Number.isNaN(port)) throw new Error('PORT must be a number');
```

**Real-world pattern: typed config with validation**

```js
// config.js
const required = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};
export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  dbUrl: required('DATABASE_URL'),
};
```

> In larger apps use a schema lib (e.g., Zod) and load `.env` in dev with `dotenv`.

------

### Process info & lifecycle

```js
process.pid;            // current PID
process.ppid;           // parent PID
process.cwd();          // current working directory
process.chdir('/srv');  // change cwd
process.argv;           // ['node', '/path/app.js', ...args]
process.execPath;       // Node binary path
process.uptime();       // seconds
process.memoryUsage();  // rss, heapTotal, heapUsed, external...
process.version;        // 'v20.x.x'
process.versions;       // dependency versions (v8, uv, openssl, ...)
```

**Exit codes**

```js
process.exitCode = 1;   // prefer setting exitCode
// process.exit(1);     // hard exit (avoid in normal flow)
```

**Stdout/stderr (note backpressure)**

```js
const ok = process.stdout.write('message\n'); // boolean
if (!ok) process.stdout.once('drain', () => {/* resume writing */});
console.error('oops'); // to stderr
```

------

### Signals & graceful shutdown

```js
import http from 'node:http';

const server = http.createServer(/* ... */).listen(process.env.PORT || 3000);

function shutdown(signal) {
  console.log(`\n${signal} received, closing...`);
  server.close((err) => {
    // close DB pools, flush logs, etc.
    process.exitCode = err ? 1 : 0;
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

**Other useful events**

- `'beforeExit'` → Node’s event loop is empty (don’t rely on it for cleanup).
- `'exit'` → last tick; **no async** work allowed.
- `'unhandledRejection'` / `'uncaughtException'` → log + decide policy (usually **crash & restart** for uncaught exceptions).

```js
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exitCode = 1;
});
```

------

### High-resolution timing

```js
const t0 = process.hrtime.bigint();
// ... do work ...
const ms = Number(process.hrtime.bigint() - t0) / 1e6;
console.log(`took ${ms.toFixed(2)}ms`);
```

OR use the standard Performance API:

```js
import { performance } from 'node:perf_hooks';
const start = performance.now();
/* work */
console.log('ms', performance.now() - start);
```

------

## `os` module essentials

```js
import os from 'node:os';

os.platform();          // 'linux' | 'darwin' | 'win32' ...
os.arch();              // 'x64', 'arm64', ...
os.release();           // kernel/OS release
os.homedir();           // '/home/app'
os.tmpdir();            // '/tmp'
os.totalmem();          // bytes
os.freemem();           // bytes
os.uptime();            // seconds
os.cpus();              // CPU core info array
os.networkInterfaces(); // NICs map
os.EOL;                 // '\n' or '\r\n'
```

**Parallelism hint (Node 19+)**

```js
import os from 'node:os';
const cores = os.availableParallelism?.() ?? os.cpus().length;
// Size a worker pool / DB pool accordingly (often cores or cores*2, measure!)
```

------

## Real-world snippets

### 1) Production-ready config with defaults & casting

```js
export function readConfig() {
  const env = process.env.NODE_ENV ?? 'development';
  const port = Number(process.env.PORT ?? 3000);
  const enableMetrics = (process.env.METRICS ?? 'true').toLowerCase() === 'true';
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
  return { env, port, enableMetrics, dbUrl: process.env.DATABASE_URL };
}
```

### 2) Health & info endpoint

```js
import os from 'node:os';

export function health() {
  return {
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    load: os.loadavg?.() ?? null, // on unix
    freeMem: os.freemem(),
  };
}
```

### 3) Abort long work when client disconnects (propagate signal)

```js
app.get('/report', async (req, res) => {
  const ac = new AbortController();
  res.on('close', () => ac.abort(new Error('client disconnected')));
  try {
    const data = await buildReport({ signal: ac.signal });
    res.json(data);
  } catch (e) {
    if (!res.headersSent) res.status(499).json({ error: String(e.message || e) });
  }
});
```

### 4) CLI args (minimal)

```js
// node app.js --port=8080 --debug
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k,v='true'] = a.replace(/^-+/, '').split('=');
    return [k, v];
  })
);
// args.port === '8080', args.debug === 'true'
```

> For real CLIs, use `yargs`/`commander` and provide `--help`.

### 5) Set a safe umask for created files

```js
// ensure group/world can read logs but not secrets
process.umask(0o022); // default-ish; secrets use 0o077 on write
```

------

## Gotchas & best practices

- **Never trust env types** — always coerce & validate.
- Prefer **`process.exitCode`** to allow in-flight logs/flushes to finish.
- Don’t do async work in `'exit'` — it won’t run.
- Handle **SIGTERM** (Kubernetes, systemd) for graceful shutdown.
- **Backpressure** applies to `process.stdout`/`stderr` too; huge logs can block.
- Use **`availableParallelism()`** (or `cpus().length`) to size **Worker Threads** / pools, then **measure**.

------

## ✅ Interview Tips

- Explain **signal handling** and **graceful shutdown**.
- Show a **typed config** pattern and why validation matters.
- Mention **hrtime/performance.now** for profiling.
- Know basic **OS introspection** to justify pool sizing and health endpoints.

------

Next: **child-process.md** (spawn/exec/fork, stdio piping, timeouts, and real-world examples like image processing and safe shelling out).