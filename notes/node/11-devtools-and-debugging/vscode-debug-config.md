**vscode-debug-config.md**

# VS Code Debug Configuration (Node + TypeScript)

## What this gives you

A ready-to-paste `launch.json` set for **Node apps**, **TS/ESM**, **tests**, **Docker/remote attach**, and **workers/cluster**—with notes on the **arguments/parameters** that matter in interviews and real work.

> Two ways to debug:
>  **Launch** (VS Code starts Node for you) vs **Attach** (you start Node with `--inspect`, VS Code attaches).

------

## Prereqs (so breakpoints hit your TS, not JS)

- TS sourcemaps:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true,
    "outDir": "dist",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler" // or NodeNext
  }
}
```

- If running TS directly, use **tsx** (fast) or **ts-node**:

```bash
npm i -D tsx
# or: npm i -D ts-node
```

------

## `launch.json` (drop in `.vscode/launch.json`)

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    // 1) Launch TS directly with tsx (dev)
    {
      "name": "Dev: tsx (server.ts)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--inspect", "--enable-source-maps", "./node_modules/tsx/dist/cli.js", "src/server.ts"],
      "cwd": "${workspaceFolder}",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "autoAttachChildProcesses": true
    },

    // 2) Launch compiled JS from dist with sourcemaps
    {
      "name": "Dev: node (dist/server.js)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/server.js",
      "runtimeArgs": ["--inspect", "--enable-source-maps"],
      "cwd": "${workspaceFolder}",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "serverReadyAction": {
        "pattern": "listening on .*:(\\d+)",
        "uriFormat": "http://localhost:%s",
        "action": "openExternally"
      }
    },

    // 3) Nodemon + TS (auto-restart)
    {
      "name": "Dev: nodemon + tsx",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "nodemon",
      "runtimeArgs": ["--exec", "node --inspect --enable-source-maps ./node_modules/tsx/dist/cli.js src/server.ts"],
      "restart": true,
      "cwd": "${workspaceFolder}",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "autoAttachChildProcesses": true
    },

    // 4) Attach to a running Node (port 9229)
    {
      "name": "Attach: 9229",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "restart": false,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },

    // 5) Attach by process picker (no port needed, local only)
    {
      "name": "Attach: Pick process",
      "type": "node",
      "request": "attach",
      "processId": "${command:PickProcess}",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },

    // 6) Vitest debug (breakpoints in tests)
    {
      "name": "Test: Vitest (run)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--inspect-brk", "${workspaceFolder}/node_modules/vitest/vitest.mjs", "run"],
      "cwd": "${workspaceFolder}",
      "env": { "NODE_ENV": "test" },
      "console": "integratedTerminal"
    },

    // 7) Jest debug
    {
      "name": "Test: Jest (runInBand)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--inspect-brk", "${workspaceFolder}/node_modules/jest/bin/jest.js", "--runInBand"],
      "cwd": "${workspaceFolder}",
      "env": { "NODE_ENV": "test" },
      "console": "integratedTerminal"
    },

    // 8) Docker/Remote attach (map paths)
    {
      "name": "Attach: Docker container",
      "type": "node",
      "request": "attach",
      "address": "localhost",
      "port": 9229,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/usr/src/app",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },

    // 9) Cluster/Workers (auto-attach child processes)
    {
      "name": "Dev: cluster (dist) + workers",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/server-cluster.js",
      "runtimeArgs": ["--inspect", "--enable-source-maps", "--inspect-port=0"],
      "autoAttachChildProcesses": true,
      "console": "integratedTerminal"
    }
  ],

  "compounds": [
    {
      "name": "App + Vitest",
      "configurations": ["Dev: tsx (server.ts)", "Test: Vitest (run)"]
    }
  ]
}
```

### Why these parameters matter

- **`runtimeArgs: ["--inspect"|"--inspect-brk"]`**: open inspector; `-brk` breaks on the first line (great for startup bugs).
- **`--enable-source-maps`**: improved stack traces mapping to TS.
- **`outFiles`**: where built JS lives; lets VS Code map TS breakpoints to generated JS.
- **`skipFiles`**: step over Node internals and deps; keeps stepping sane.
- **`autoAttachChildProcesses`**: crucial for **Worker Threads**, **cluster**, test runners spawning child Node processes.
- **`serverReadyAction`**: open the app once “listening” appears in output.
- **Docker `localRoot/remoteRoot`**: path mapping between host and container FS.

------

## How to start the app for **Attach**

Start Node yourself (port must match the attach config):

```bash
# Local
node --inspect=9229 dist/server.js

# In Docker (forward port)
docker run -p 3000:3000 -p 9229:9229 myapp \
  node --inspect=0.0.0.0:9229 dist/server.js
# Then hit "Attach: Docker container"
```

**Workers/Cluster**

- In your code, give workers unique ports so VS Code can attach:

```ts
new Worker(new URL('./worker.js', import.meta.url), { execArgv: ['--inspect-port=0'] });
```

- With cluster, launch with `--inspect-port=0` and `"autoAttachChildProcesses": true`.

------

## Quality-of-life tips (you’ll actually use)

- **Conditional breakpoints / hit counts / logpoints**
   Right-click a breakpoint → add:
  - *Condition*: `user?.id === 'u_42'`
  - *Hit count*: `>= 5`
  - *Log message*: `orderId = {order.id}` (no pause)
- **Debug Console eval**: evaluate expressions in current scope while paused.
- **“Debug: Toggle Auto Attach”** (Command Palette) to grab new Node procs automatically.
- **Trace adapter** if debugging the debugger: add `"trace": true` to a config.

------

## Common gotchas (and fixes)

- **Hollow breakpoints** → you’re debugging compiled JS but set BP in TS. Fix with sourcemaps or run via tsx/ts-node.
- **No break in startup** → use `--inspect-brk` or `"stopOnEntry": true`.
- **Docker paths wrong** → set `localRoot`/`remoteRoot`.
- **Workers not pausing** → ensure `execArgv: ['--inspect-port=0']` and `autoAttachChildProcesses: true`.
- **Cluster multiple targets** → each worker shows as a separate target; attach is automatic if auto-attach is on.
- **Tests hang** → use `--runInBand` (Jest) to avoid parallel child processes during debugging.

------

## Realistic workflow examples

### Debug a failing auth route (TS + tsx)

1. Run **“Dev: tsx (server.ts)”**.
2. Set a **conditional breakpoint** in `routes/auth.ts` where `email === 'admin@example.com'`.
3. Reproduce via Postman/Supertest; step through JWT/signin logic.

### Debug production-like container

1. `kubectl port-forward pod/api-xyz 9229:9229`.
2. Start Node in the pod with `--inspect=0.0.0.0:9229`.
3. Use **“Attach: Docker container”** with `remoteRoot: "/usr/src/app"`.

### Debug a worker pool hot path

1. Launch **“Dev: cluster (dist) + workers”**.
2. Put a breakpoint in the **worker file**.
3. Ensure the worker uses `execArgv: ['--inspect-port=0']` so VS Code attaches automatically.

------

## Bonus: NPM script launcher

If your `package.json` has a debug script:

```json
"scripts": {
  "dev:debug": "node --inspect -r dotenv/config ./node_modules/tsx/dist/cli.js src/server.ts"
}
```

Use this config:

```jsonc
{
  "name": "Dev: npm run dev:debug",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run-script", "dev:debug"],
  "console": "integratedTerminal"
}
```

------

## ✅ Interview sound bites

- “I use **launch** for local dev (tsx/nodemon) and **attach** for Docker/remote with `--inspect`.”
- “For **TS**, I enable **sourcemaps** and `--enable-source-maps` for accurate stacks.”
- “Workers/cluster need `--inspect-port=0` + **auto-attach** to break inside child processes.”
- “For tests, I run **Vitest/Jest under `--inspect-brk`** and use `--runInBand` for predictable debugging.”

------

Want me to continue with **nodemon-and-reloaders.md** next?