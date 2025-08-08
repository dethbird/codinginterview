**nodemon-and-reloaders.md**

# Nodemon & Reloaders (fast dev cycles for Node + TS)

## 📌 What & why

Reloaders **watch files** and **restart** your Node process when code changes. They speed up feedback loops during API development. Popular choices:

- **nodemon** (classic restarter)
- **tsx** (TS/ESM runner with **built-in watch**)
- **ts-node-dev** (fast TS restarts)
- Also workable: **tsc -w + nodemon** (compile then run `dist/`)

> Interview line: “In dev I use **tsx --watch** (or **nodemon** + `tsx`) with **graceful shutdown** and ignore `node_modules`/`dist` so reloads are fast and safe—even inside Docker with polling.”

------

## Option A — `tsx` (recommended, simplest with TS/ESM)

### Scripts

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch --inspect src/server.ts",
    "dev:fast": "NODE_ENV=development tsx watch src/server.ts",   // no inspector
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
```

**Arguments to know**

- `watch` — enables chokidar-based watcher.
- `--inspect` — opens the Node inspector (works with VS Code attach).
- Works with ESM/TS **without extra loaders**.

**Real-world note**: add a **graceful shutdown** handler (below) so restarts don’t drop requests.

------

## Option B — `nodemon` (+ `tsx` runner)

### Install & config

```bash
npm i -D nodemon tsx
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["dist", "node_modules", ".git"],
  "delay": "150ms",
  "exec": "node --inspect --enable-source-maps ./node_modules/tsx/dist/cli.js src/server.ts",
  "env": { "NODE_ENV": "development" },
  "signal": "SIGTERM"         // send SIGTERM to app on restart
}
```

### Script

```json
{ "scripts": { "dev": "nodemon" } }
```

**Key parameters**

- `watch` — globs/dirs to watch.
- `ext` — extensions that trigger restart.
- `ignore` — reduce noisy restarts (critical for monorepos).
- `delay` — debounce burst changes.
- `exec` — *how* to run your app (here: `tsx`).
- `signal` — signal used to stop the old process (default `SIGUSR2`; prefer `SIGTERM` for standard handlers).

------

## Option C — `ts-node-dev` (fast TS restarts)

```bash
npm i -D ts-node-dev
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only --inspect src/server.ts"
  }
}
```

**Flags that matter**

- `--respawn` — restart process on change.
- `--transpile-only` — skip type-check on the hot path (run `tsc -w` separately if you want type errors live).
- `--inspect` — debugger.

------

## Option D — `tsc -w` + `nodemon` (compile then run dist)

```json
{
  "scripts": {
    "dev:build": "tsc -w",
    "dev:run": "nodemon --watch dist --ext js,json --exec node --enable-source-maps dist/server.js",
    "dev": "npm-run-all -p dev:build dev:run"
  }
}
```

**Why use this**: closest to prod runtime (compiled JS), great if runtime loaders are problematic.

------

## Graceful shutdown (avoid dropping requests on restart)

When reloader stops the old process, **finish in-flight requests**, close the server, then exit.

```ts
// server.ts
import http from 'node:http';
import { app } from './app'; // your express app
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`listening on :${PORT}`));

function shutdown(sig: string) {
  console.log(`\n${sig} received, closing…`);
  // stop accepting new connections
  server.close(err => {
    if (err) { console.error('close error', err); process.exit(1); }
    process.exit(0);
  });
  // safety timer
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

> In `nodemon.json` we set `"signal": "SIGTERM"` so your handler runs on restarts.

------

## Watching templates/static too (optional)

```json
{
  "watch": ["src", "views", "public"],
  "ext": "ts,js,json,ejs,css"
}
```

If template changes don’t reflect, ensure your template engine isn’t caching in dev.

------

## Docker & WSL tips (file watching pitfalls)

- Bind mounts sometimes don’t forward inotify events. Use **polling**:

  - For **tsx** / chokidar:

    ```bash
    export CHOKIDAR_USEPOLLING=1
    export CHOKIDAR_INTERVAL=300
    ```

  - For **nodemon**:

    - `nodemon -L` (legacy polling) **or** set `"legacyWatch": true` in `nodemon.json`.

- Mount only what you need (`.:/usr/src/app`) and **ignore node_modules** by installing inside the container.

- In compose:

  ```yaml
  environment:
    - CHOKIDAR_USEPOLLING=1
    - CHOKIDAR_INTERVAL=300
  ```

------

## Speed & stability checklist

- ✅ **Ignore** `node_modules`, `.git`, `dist`, generated files.
- ✅ Add a **debounce** (`delay`) to batch restarts.
- ✅ Keep **type-check** off hot path (`tsx`/`ts-node-dev --transpile-only`) and run `tsc -w` in parallel if desired.
- ✅ Implement **graceful shutdown** (above).
- ✅ Use `--enable-source-maps` for clean stack traces in dev.
- ✅ In Docker/remote, switch to **polling** if watch events drop.

------

## Combining with tests & lint in watch

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "dev:test": "vitest --watch",
    "dev:lint": "eslint --ext .ts src --watch"
  }
}
```

Run in parallel (e.g., with `npm-run-all -p dev dev:test`).

------

## When to prefer each tool (sound bites)

- **tsx watch**: *I want minimal config with ESM/TS; fastest path.*
- **nodemon + tsx**: *I need fine-grained control (ignore lists, signals, events).*
- **ts-node-dev**: *Classic DX; quick restarts; OK to skip type-check on hot path.*
- **tsc -w + nodemon**: *Prod-like runtime (compiled JS), more moving parts but very predictable.*

------

## Nodemon extras you might actually use

- **Events hook** (run a command on restart)

  ```json
  { "events": { "restart": "echo 'Restarted at ' %date% %time%" } }
  ```

- **Env per profile**

  ```json
  { "env": { "NODE_ENV": "development", "LOG_LEVEL": "debug" } }
  ```

- **Multiple watch roots**

  ```json
  { "watch": ["src", "packages/shared/src"] }
  ```

------

## Common pitfalls (and fixes)

- **App exits instantly on restart** → you didn’t handle the reloader’s signal; add graceful shutdown.
- **Double restarts** → watcher is watching build output and source; ignore `dist`.
- **Breakpoints not hit** → ensure you run with `--inspect` and sourcemaps; or use the VS Code `launch.json` we set up.
- **Docker changes not detected** → enable polling (`CHOKIDAR_USEPOLLING=1` or `nodemon -L`).
- **Type errors missing** → `tsx/ts-node-dev` with transpile-only; run `tsc -w` in parallel for type-check.

------

## ✅ Interview Tips

- “I prefer **`tsx watch`** for Node+TS—zero config, ESM-friendly, and fast.”
- “For fine control or Docker quirks I use **nodemon** with a **graceful SIGTERM** handler.”
- “Watching in containers sometimes needs **polling**; I set `CHOKIDAR_USEPOLLING=1`.”
- “I keep **type-check** off the hot path and run `tsc -w` separately if I want live errors.”

------

Want me to continue with **ts-node-tsx.md** (already partly covered) or jump to **12-deployment-and-ops/env-config-dotenv.md**?