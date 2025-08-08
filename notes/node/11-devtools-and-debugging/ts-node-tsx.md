**ts-node-tsx.md**

# ts-node & tsx (run TypeScript directly)

## 📌 What & why

You don’t always want to `tsc` → `dist` during dev. **`ts-node`** and **`tsx`** run `.ts/.tsx` files **directly**:

- **`tsx`** (esbuild-powered) → *very fast transpile*, ESM-friendly, great for `dev` + `--watch`. No type-checking; run `tsc -w` in parallel if you want live errors.
- **`ts-node`** (TypeScript compiler) → Most compatible, can do **type-aware transpile** (slower) or `--transpile-only`. Works with **ESM** via Node’s loader.

> Interview line: “I use **tsx** for hot dev speed and **ts-node** when I need maximum TS compatibility or special compiler behaviors. I keep type-checking via `tsc -w` off the hot path.”

------

## Quick decision guide

- **New ESM repo, want fast dev** → `tsx watch src/server.ts`
- **Need strict compatibility with TS compiler semantics** (decorators/emit quirks) → `ts-node` (possibly with `--transpile-only` + `tsc -w`)
- **ESM everywhere** (Node 18+) → both work; prefer `tsx` or `ts-node` with the **ESM loader**

------

## Project prep (TS + ESM-friendly)

```jsonc
// package.json
{
  "type": "module",                // ESM by default (good for both tools)
  "scripts": {
    "dev": "tsx watch --inspect src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
// tsconfig.json (baseline)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",            // or "NodeNext"
    "moduleResolution": "Bundler", // or "NodeNext"
    "sourceMap": true,
    "inlineSources": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "outDir": "dist",
    "strict": true
  },
  "include": ["src", "tests"]
}
```

> **NodeNext vs Bundler**:
>
> - **Bundler** (Vite/tsx/esbuild style) resolves like a bundler; easy for aliases.
> - **NodeNext** matches Node’s ESM rules (you’ll need file extensions in imports).

------

## Option A — `tsx` (recommended for dev)

### Install & run

```bash
npm i -D tsx typescript
# run once
npx tsx src/server.ts

# watch & inspect (debugger)
npx tsx watch --inspect src/server.ts
```

### As a Node loader (pure ESM flow)

```bash
node --loader tsx src/server.ts
```

### Path aliases

`tsx` (via esbuild) honors `tsconfig.paths` automatically in most setups. No extra resolver needed.

### Common flags you’ll care about

- `watch` – restarts on file changes.
- `--inspect` – opens Node inspector (attach from VS Code).
- `--env-file .env` (if using the env-file variant of tsx) — some setups support auto `.env` loading; otherwise `dotenv`.

> **Type checking**: `tsx` doesn’t type-check. Run `tsc -w` in a parallel terminal:

```bash
npm run build -- -w
```

------

## Option B — `ts-node` (max compatibility)

### Install & run

```bash
npm i -D ts-node typescript
```

**Classic (CJS/ESM-agnostic via register):**

```bash
node -r ts-node/register src/server.ts
```

**ESM loader (Node 18+):**

```bash
node --loader ts-node/esm src/server.ts
# or
npx ts-node --esm src/server.ts
```

**Fast path (no type-check)**

```bash
npx ts-node --transpile-only src/server.ts
```

**Using SWC for speed (optional)**

```bash
npx ts-node --swc src/server.ts
```

> `--swc` speeds transpilation; still no type-check during run.

### Path aliases with `ts-node`

For `@/*` to work at runtime, add **tsconfig-paths**:

```bash
npm i -D tsconfig-paths
node -r ts-node/register -r tsconfig-paths/register src/server.ts
# ESM:
node --loader ts-node/esm --require tsconfig-paths/register src/server.ts
```

### Useful flags/params

- `--project tsconfig.dev.json` – alternate config
- `--transpile-only` – skip type-check for speed
- `--compiler-options '{"module":"esnext"}'` – quick overrides
- `--swc` – faster transpile (needs `@swc/core`)

------

## Debugging (both tools)

- Add `--inspect` (or `--inspect-brk`) and attach from VS Code (we set this up in `vscode-debug-config.md`).
- For Workers/Cluster, pass `execArgv: ['--inspect-port=0']` when you spawn them so the debugger can attach.

------

## Nodemon combos (dev ergonomics)

**tsx + nodemon** (for fine-grained control):

```json
// nodemon.json
{ "watch": ["src"], "ext": "ts,js,json",
  "ignore": ["dist","node_modules"], "signal": "SIGTERM",
  "exec": "node --inspect --enable-source-maps ./node_modules/tsx/dist/cli.js src/server.ts"
}
```

**ts-node-dev** (alternative restarter):

```json
{ "scripts": { "dev": "ts-node-dev --respawn --transpile-only --inspect src/server.ts" } }
```

------

## ESM vs CJS (what bites people)

- **ESM** (`"type":"module"`) requires **file extensions** in bare Node with `moduleResolution: NodeNext`.
   `import { x } from './util.ts'` (yes, `.ts`) or compile to JS first.
   Using **Bundler** resolution + `tsx` sidesteps this in dev.
- **CommonJS** (no `"type":"module"`) → use `require()` or transpile ESM to CJS; stick to one style.

**My rule:** Go **ESM** + `tsx` in dev, compile to JS for prod. If you must run in pure Node ESM with no bundler semantics, set `moduleResolution: NodeNext` and write extension-ful imports.

------

## Keep type checking in CI (realistic pipeline)

```json
// package.json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "build": "tsc -p tsconfig.json"
  }
}
```

- Dev: fast `tsx` loop.
- CI: `npm run typecheck` fails builds on TS errors.
- Prod: build once; run `node dist/server.js`.

------

## Real-world examples

### 1) CLI script in TS (runs anywhere)

```ts
// scripts/create-user.ts
import 'dotenv/config';
import { createUser } from '../src/services/users';

const email = process.argv[2];
await createUser(email);
console.log('ok');
```

Run:

```bash
npx tsx scripts/create-user.ts alice@example.com
# or
node -r ts-node/register -r tsconfig-paths/register scripts/create-user.ts alice@example.com
```

### 2) Express app with aliases (tsx)

```bash
npx tsx watch --inspect src/server.ts
// src/server.ts
import express from 'express';
import { ping } from '@/lib/ping'; // paths alias
const app = express();
app.get('/health', (_req, res) => res.json({ ok: ping() }));
app.listen(3000, () => console.log('listening on :3000'));
```

### 3) ts-node ESM loader (pure Node flow)

```bash
node --loader ts-node/esm --no-warnings=ExperimentalWarning src/server.ts
```

------

## Common pitfalls (and how to fix)

- **“Cannot use import statement outside a module”**
   → You’re in CJS mode. Add `"type":"module"` or run via ESM loader (`--loader ts-node/esm`) or compile first.
- **Path aliases work in TS but not at runtime**
   → For `ts-node`, add `tsconfig-paths/register`. For `tsx`, ensure `paths` is set; `tsx` usually honors it.
- **Breakpoints not hit**
   → Use `--inspect` and enable source maps (`--enable-source-maps` or TS emits). VS Code: set `outFiles` if running compiled JS.
- **Slow dev with ts-node**
   → Use `--transpile-only` (and run `tsc -w` separately), or switch to **tsx**.
- **ESM import file extensions** complaints
   → Use `moduleResolution: Bundler` + `tsx` in dev, or include extensions when using NodeNext.

------

## ✅ Interview Tips

- “**tsx** uses esbuild for fast transpile; I pair it with `tsc -w` for type-checking.”
- “**ts-node** supports ESM via Node’s **loader** (`--loader ts-node/esm`); I use `--transpile-only` for speed.”
- “Path aliases in dev: **tsx** reads `tsconfig.paths`; **ts-node** needs `tsconfig-paths/register`.”
- “In ESM mode you may need **file extensions** unless you use bundler-style resolution.”
- “I keep **type-checking in CI** with `tsc --noEmit` and ship compiled JS to prod.”

------

Want me to continue with **12-deployment-and-ops/env-config-dotenv.md** next?