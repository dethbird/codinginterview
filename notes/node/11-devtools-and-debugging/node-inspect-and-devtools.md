**node-inspect-and-devtools.md**

# Node Inspect & DevTools (debugging)

## 📌 What & why

The **Node inspector** exposes a debugging port so you can use **Chrome DevTools** (or VS Code) to set breakpoints, step through code, inspect variables, profiles, and take heap snapshots. Use it for “it crashes here”, “why is this value undefined?”, “what’s allocating memory?”, or “what’s blocking the event loop?”.

------

## Fastest ways to start debugging

### 1) Start your app with the inspector

```bash
# Attach immediately but let code run
node --inspect src/server.js

# Break before the first line (handy for early breakpoints)
node --inspect-brk src/server.js
```

Then open **`chrome://inspect` → “Open dedicated DevTools for Node”** and click your process.

> Ports: defaults to **127.0.0.1:9229**. You can set a host/port:
>  `node --inspect=0.0.0.0:9229` or `--inspect-brk=localhost:9230`

### 2) Attach to an already running process

- Send **SIGUSR1** to enable the inspector on the default port:

  ```bash
  kill -SIGUSR1 <pid>   # Linux/macOS
  ```

- Then open **`chrome://inspect`** and attach.

### 3) Debug tests (Jest/Vitest)

```bash
# Break on first test line
node --inspect-brk node_modules/vitest/vitest.mjs run
# or
node --inspect-brk node_modules/jest/bin/jest.js --runInBand
```

------

## Common flags you’ll actually use

```bash
--inspect[=host:port]       # start inspector
--inspect-brk               # break on first line
--trace-warnings            # show stack for warnings (EventEmitter leak, etc.)
--trace-uncaught            # show full stack for uncaught exceptions
--unhandled-rejections=strict # crash on unhandled promise rejections
--trace-deprecation         # where deprecated API is used
--cpu-prof --heap-prof      # write profiles (open in DevTools)
```

> You can also set once via env:
>  `NODE_OPTIONS="--inspect --unhandled-rejections=strict"`

------

## Breakpoints 101

### Add an inline breakpoint

```ts
function compute(x: number) {
  debugger;                 // DevTools will pause here
  return x * 2;
}
```

### Conditional & logpoints (in DevTools)

- **Conditional**: right-click a breakpoint → only pause when expression is true (e.g., `id === 'u_42'`).
- **Logpoint**: prints a message without pausing (great for noisy hot paths).

### Step controls (what they do)

- **Step over**: run the current line, don’t enter called functions.
- **Step into**: enter the next function call.
- **Step out**: finish current function and pause.

------

## Source maps & TypeScript (so breakpoints hit your TS, not JS)

1. Enable source maps in TS:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true,
    "outDir": "dist",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

1. Run compiled code with maps:

```bash
node --inspect dist/server.js
```

**or** run TS directly with sourcemaps:

```bash
# tsx (fast)
npx tsx --inspect src/server.ts
# ts-node (slower)
node --inspect -r ts-node/register src/server.ts
```

> In DevTools, enable **“Enable source maps”**. If breakpoints look hollow (not hit), you’re not attaching to the right file (built JS vs TS), or sourcemaps aren’t emitted.

------

## Debugging in Docker / remote hosts

- Expose the port and bind to all interfaces:

  ```bash
  node --inspect=0.0.0.0:9229 dist/server.js
  ```

- Docker:

  ```bash
  docker run -p 3000:3000 -p 9229:9229 myapp \
    node --inspect=0.0.0.0:9229 dist/server.js
  ```

- Then from your machine: **`chrome://inspect` → “Configure…” → add host/port** (container/VM IP).

**Tip:** In K8s, `kubectl port-forward pod/xyz 9229:9229` then attach locally.

------

## Child processes, Workers, Cluster

### Worker Threads: give each worker a debug port

```ts
import { Worker } from 'node:worker_threads';
new Worker(new URL('./worker.js', import.meta.url), {
  execArgv: ['--inspect-port=0']  // 0 = pick a free port per worker
});
```

You’ll see multiple targets under `chrome://inspect`.

### Cluster: different ports per worker

Start with `--inspect-port=0` so each worker picks a unique port:

```bash
node --inspect-port=0 server-cluster.js
```

------

## Memory & performance from DevTools

- **Memory tab** → **Heap snapshot**: find leaks (large **Retained size**, check **Retainers**).
- **Performance tab** → record CPU profile while reproducing a slow path; look for **wide frames** of sync work (`zlib.*Sync`, `crypto.*Sync`, huge `JSON.stringify`).
- **Allocation sampling** (Performance tab) → see what code allocates most.

> For offline captures without DevTools, use `--cpu-prof/--heap-prof` and open the `.cpuprofile/.heapprofile` files in DevTools later.

------

## Async stacks (follow promises)

In DevTools **Settings → Preferences → Console** enable **Async stack traces**. You’ll see the chain across `await`s (costs a little overhead; fine for debugging).

------

## Useful runtime tricks

### Print where a warning came from

```bash
node --trace-warnings dist/server.js
# EventEmitter memory leak detected… (stack shows where listeners were added)
```

### Crash on unhandled rejections (good in dev/CI)

```bash
node --unhandled-rejections=strict dist/server.js
```

### Programmatic inspector (take a heap snapshot in code)

```ts
import inspector from 'node:inspector';
const session = new inspector.Session();
session.connect();
await session.post('HeapProfiler.enable');
await session.post('HeapProfiler.takeHeapSnapshot'); // stream ‘data’ events if needed
session.disconnect();
```

------

## Real-world debugging workflows

### 1) “It crashes on startup”

- Run with `--inspect-brk`, set breakpoints in **config/bootstrap** files.
- Step line-by-line; inspect `process.env` and resolved paths.
- Turn on `--trace-deprecation` for legacy APIs.

### 2) “Something is `undefined` in this request”

- Add `debugger` near the route, repro locally.
- Use **scopes** panel (Local/Closure/Global) to inspect variables.
- Convert noisy breakpoints to **logpoints** to print values per call without pausing.

### 3) “Memory keeps growing”

- Attach inspector to prod-like load; take **two heap snapshots** (steady vs after traffic).
- Sort by **Retained size** and follow **Retainers** to the leak root (e.g., a Map keyed by request id).
- Check warnings: `--trace-warnings` often points at **EventEmitter** listener leaks.

### 4) “CPU spikes / slow p99”

- Record **Performance** in DevTools during a load test.
- Look for **sync** offenders; replace with async APIs or move to **Worker Threads**.
- Check **Network** panel for slow upstreams; add timeouts.

------

## Common gotchas (and fixes)

- **Breakpoints not hit** → you’re running compiled JS but set breakpoints in TS; enable sourcemaps or run TS directly (`tsx`).
- **Can’t attach in Docker** → forgot `--inspect=0.0.0.0` or `-p 9229:9229`.
- **Multiple processes** → cluster/workers each have their own port; use `--inspect-port=0`.
- **Server exits before you attach** → use `--inspect-brk` to pause at line 1.
- **Prod security** → never expose 9229 publicly. Restrict by network/SSH tunnel.

------

## Quick snippets (copy/paste)

**Start with inspect in dev**

```json
// package.json
{
  "scripts": {
    "dev": "tsx --inspect src/server.ts",
    "debug": "node --inspect-brk dist/server.js"
  }
}
```

**Attach on-demand in prod-like env**

```bash
kill -SIGUSR1 $(pgrep -f "node .*dist/server.js")
# now connect to 127.0.0.1:9229 via SSH port-forward if remote
```

**Worker with zero-copy transfer (debuggable)**

```ts
// main
const w = new Worker(new URL('./img-worker.js', import.meta.url), { execArgv: ['--inspect-port=0'] });
const buf = new ArrayBuffer(1024*1024);
w.postMessage({ buf }, [buf]); // transferred, not copied
```

------

## ✅ Interview Tips

- Explain `--inspect` vs `--inspect-brk`, and how to attach via `chrome://inspect`.
- Mention **SIGUSR1** to attach to a running process.
- Call out **sourcemaps** for TS and how you avoid “hollow” breakpoints.
- Describe debugging **Workers/Cluster** with `--inspect-port=0`.
- Show how you’d chase **memory leaks** (heap snapshots) and **CPU spikes** (Performance flamegraph).

------

Next up: **vscode-debug-config.md** or go straight to **nodemon-and-reloaders.md**?