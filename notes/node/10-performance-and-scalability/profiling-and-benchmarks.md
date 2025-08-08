**profiling-and-benchmarks.md**

# Profiling & Benchmarks (Node.js)

## 📌 What & why

**Profiling** finds where CPU time and memory go (flamegraphs, heap snapshots).
 **Benchmarks** measure performance at different scopes: **micro (functions)** vs **macro (HTTP/load)**. Use both to **diagnose**, not just to chase numbers.

------

## Toolbelt (what you’ll actually use)

- **Built-in CPU/heap profiling**
  - `--cpu-prof`, `--heap-prof` flags → write `.cpuprofile` / `.heapprofile` (inspect in Chrome DevTools).
  - `inspector` heap snapshot: `node --inspect` → `chrome://inspect`.
- **clinic.js** (`clinic doctor|flame|heap`) → one-command flamegraphs & leak hunting.
- **0x** → fast flamegraphs from production-like runs.
- **Benchmark.js** → micro-bench comparisons.
- **autocannon** / **wrk** / **Artillery** → HTTP load testing.
- **perf_hooks** → event-loop delay, high-res timers.
- **pprof (optional)** → `@clinic/pprof` if you prefer pprof tooling.

------

## Quick CPU profile (prod-sim)

```bash
# Run your server under load and capture CPU
NODE_OPTIONS="--cpu-prof --cpu-prof-dir=./profiles" node dist/server.js
# Hit it with load (in another shell)
npx autocannon -c 100 -d 20 http://localhost:3000/api/list
# Stop server → inspect ./profiles/XXXXXXXX.cpuprofile in Chrome DevTools (Performance panel → Load profile)
```

**Flags you should know**

- `--cpu-prof-interval` (µs): sampling interval (default ~1000µs).
- `--heap-prof-interval`, `--heap-prof-name`, `--heap-prof-dir`.
- `--trace-gc` (verbose; use sparingly) to log GC events.

------

## Heap snapshot (find leaks)

```bash
node --inspect=0.0.0.0:9229 dist/server.js
# Open chrome://inspect → Target → Open dedicated DevTools → Memory → "Take heap snapshot"
```

**Interpretation**

- **Retainers**: why an object is still referenced.
- **Dominators**: objects holding large subgraphs.
- Compare **two snapshots** (idle vs post-load) to spot growth.

------

## Event loop lag & high-res timing (built-in)

```ts
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
const h = monitorEventLoopDelay({ resolution: 10 }); h.enable();

setInterval(() => {
  console.log('EL delay p95(ms):', (h.percentile(95) / 1e6).toFixed(2));
  h.reset();
}, 5000);

// Timing a block
const t0 = performance.now();
// ...work...
console.log('ms=', (performance.now() - t0).toFixed(2));
```

*Use EL delay percentiles to catch **blocking** (sync work, big JSON, compression on main thread).*

------

## clinic.js (easy mode)

```bash
npm i -D clinic
# Doctor (guidance) - runs your cmd then shows report
npx clinic doctor -- node dist/server.js
# In another shell, apply load, then Ctrl+C → opens report
# Flame only
npx clinic flame --autocannon [ -c 100 -d 20 http://localhost:3000/api/list ] -- node dist/server.js
# Heap (leaks)
npx clinic heap --autocannon [ ... ] -- node dist/server.js
```

**Read the flamegraph**

- **Wide frames near the top** = hot code; **wide frames at bottom** = frequently called entry points.
- Look for **sync** culprits: `pbkdf2Sync`, `zlib.gzipSync`, large `JSON.stringify`, regex backtracking.

------

## 0x (another flamegraph tool)

```bash
npx 0x -o ./flames node dist/server.js &
npx autocannon -c 100 -d 20 http://localhost:3000/api/list
kill %1
# opens flamegraph interactively
```

------

## HTTP load testing (macro benchmark)

```bash
# Basic
npx autocannon -c 200 -p 10 -d 30 http://localhost:3000/api/list
# JSON body & headers
npx autocannon -c 100 -d 20 -m POST -H content-type=application/json -b '{"q":"foo"}' http://localhost:3000/search
```

**Params that matter**

- `-c` concurrency, `-p` pipelining, `-d` duration, `-m` method, `-b` body, `-H` headers.
- Watch **latency p95/p99**, **throughput**, and **non-2xx/5xx**.

**Artillery (scenarios & soak)**

```yaml
# artillery.yaml
config: { target: "http://localhost:3000", phases: [ { duration: 300, arrivalRate: 20 } ] }
scenarios: [ { flow: [ { get: { url: "/health" } }, { post: { url: "/login", json: { email: "a@b.com", password: "x" } } } ] } ]
npx artillery run artillery.yaml
```

------

## Micro-benchmarks (Benchmark.js)

```ts
import Benchmark from 'benchmark';
const suite = new Benchmark.Suite();

function fast(a: string) { return a + 'x'; }
function slow(a: string) { return `${a}x`; }

suite
  .add('concat', () => fast('a'))
  .add('template', () => slow('a'))
  .on('cycle', e => console.log(String(e.target)))
  .on('complete', function () { console.log('Fastest is', this.filter('fastest').map('name')); })
  .run({ async: true });
```

**Guardrails**

- Warm up the JIT (Benchmark.js does).
- Benchmark **realistic inputs** (string sizes, array lengths).
- Micro-wins that disappear in macro tests are **not** wins.

------

## Real-world diagnosis playbook

### “My endpoint is slow (p99 spikes)”

1. **Metrics first**: check p95/p99 and error rates (see `metrics-prometheus.md`).
2. **CPU profile under load**: `--cpu-prof` + autocannon.
3. If frames show **sync crypto/compression/regex** → move to **Worker Threads**, async APIs, or lighten payloads.
4. If frames show **DB client** → add **index**, reduce N+1, batch, or increase **pool** size (see DB notes).
5. If frames show **JSON.stringify** on huge objects → **stream** or paginate; precompute; avoid circular refs.

### “Memory keeps growing”

1. **Take heap snapshots** after steady-state, then after traffic → compare.
2. Look for big Retained Size via **Maps/arrays** tied to caches, global arrays, event listeners not removed.
3. Common leaks: **LRU cache with unbounded keys**, per-request listeners on global emitter, setInterval without `clearInterval`.
4. Add **TTL/size** to caches; ensure **removeListener** on cleanup; call `.unref()` for timers if appropriate.

### “Event loop delay spikes”

- Use `monitorEventLoopDelay`. If p95 > few ms regularly:
  - Avoid sync CPU work (zlib, crypto) on main thread → **Worker Threads**.
  - Replace catastrophic regex; chunk large JSON (streams).
  - Profile GC: too many short-lived allocations → avoid intermediate arrays/objects in hot paths.

------

## Worker Threads for CPU-bound hotspots (quick primer)

```ts
// main.ts
import { Worker } from 'node:worker_threads';
export function hash(password: string) {
  return new Promise((res, rej) => {
    const w = new Worker(new URL('./hash-worker.js', import.meta.url), { workerData: password });
    w.once('message', res); w.once('error', rej); w.once('exit', (c) => c && rej(new Error('exit '+c)));
  });
}
// hash-worker.ts
import { parentPort, workerData } from 'node:worker_threads';
import { pbkdf2Sync } from 'node:crypto';
const out = pbkdf2Sync(String(workerData), 'salt', 1e5, 32, 'sha256');
parentPort!.postMessage(out.toString('hex'));
```

*Moves blocking CPU off the event loop → better tail latency.*

------

## JSON & serialization gotchas (common in profiles)

- `JSON.stringify` is **sync** and can dominate CPU for big payloads; prefer **streams** (`res.write` chunks) or **compress** on a reverse proxy not in-process.
- Don’t prettify JSON in prod.
- Avoid shallow copying large arrays/objects in tight loops (`{...obj}`, `[...arr]`).

------

## GC & memory knobs (use sparingly)

- `--max-old-space-size=2048` (MB) to raise heap cap—**only after fixing leaks**.
- `global.gc()` requires `--expose-gc` (use in one-off scripts, not servers).
- Tune object lifetimes instead (reduce churn, reuse buffers, pool where sensible).

------

## Repeatable perf tests (scripts you can paste)

```json
// package.json
{
  "scripts": {
    "bench:http": "autocannon -c 100 -d 20 http://localhost:3000/health",
    "prof:cpu:start": "NODE_OPTIONS='--cpu-prof --cpu-prof-dir=profiles' node dist/server.js",
    "clinic:flame": "clinic flame --autocannon [ -c 100 -d 20 http://localhost:3000/api/list ] -- node dist/server.js"
  }
}
```

------

## Common pitfalls

- Profiling **without load** → misleading flat profiles.
- Comparing **micro-bench wins** that don’t move **p95** at the macro level.
- High-cardinality metrics in perf runs → Prometheus bloat (keep labels bounded).
- Forgetting to run Node with the **same flags/env** as prod (TLS, cluster, container CPU limits).

------

## ✅ Interview Tips

- Explain **when to profile** (after metrics identify a hotspot) and how you choose tools (`--cpu-prof`, clinic).
- Distinguish **CPU-bound** vs **I/O-bound** symptoms (EL delay vs latency vs throughput).
- Describe reading a **flamegraph** and typical fixes (index queries, batch I/O, move CPU to workers).
- Show you understand **heap snapshots** (retainers/dominators) for leak hunting.
- Always tie changes back to **p95/p99** improvements, not just average latency.

------

Want to proceed to **worker-threads-vs-cluster.md** next?