**config-strategy.md**

# Configuration Strategy (what goes where, how to load it, and keep it sane)

## 📌 Goals

- **Single source of truth** for settings (don’t `process.env.X` all over).
- **Typed & validated** config at startup → fail fast, clear errors.
- **12-factor**: secrets & deploy-time values come from **env vars** (or a secret manager).
- **Predictable precedence**: defaults < files < env < CLI flags.
- **Module-scoped** config**:** pass only what a module needs.

------

## What belongs where

- **Code defaults**: safe, non-secret fallbacks (e.g., `http.port=3000`).
- **Env vars / secret manager**: secrets (`DATABASE_URL`, `JWT_SECRET`), URLs, per-env toggles.
- **Flags** (CLI): operator overrides (`--log-level=debug`, `--migrate=true`).
- **DB/remote dynamic config**: feature flags, rate limits (when you need runtime flips).
  - Use a **cache + TTL**; never block the hot path on remote config.

------

## Layered loader (defaults → files → env → flags)

```ts
// src/config/loader.ts
import { z } from 'zod';
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// 1) Defaults (safe, non-secrets)
const defaults = {
  NODE_ENV: 'development',
  PORT: 3000,
  LOG_LEVEL: 'info',
  CORS_ORIGIN: 'http://localhost:5173',
  ENABLE_SIGNUPS: true
} as const;

// 2) Optional .env files in dev/test
if (process.env.NODE_ENV !== 'production') {
  const envName = process.env.NODE_ENV || 'development';
  for (const f of [`.env.${envName}.local`, `.env.${envName}`, `.env.local`, `.env`]) {
    dotenv.config({ path: f, override: false });
  }
}

// 3) CLI flags (highest precedence)
const argv = yargs(hideBin(process.argv))
  .option('port', { type: 'number', describe: 'HTTP port' })
  .option('log-level', { type: 'string', choices: ['fatal','error','warn','info','debug','trace'] })
  .option('read-only', { type: 'boolean', describe: 'Disable writes (maintenance)' })
  .parseSync();

// 4) Schema (types + coercions + constraints)
const Env = z.object({
  NODE_ENV: z.enum(['development','test','production']).default(defaults.NODE_ENV),
  PORT: z.coerce.number().int().min(1).max(65535).default(defaults.PORT),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default(defaults.LOG_LEVEL),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),

  CORS_ORIGIN: z.string().default(defaults.CORS_ORIGIN),
  ENABLE_SIGNUPS: z.coerce.boolean().default(defaults.ENABLE_SIGNUPS),

  READ_ONLY: z.coerce.boolean().default(false),
  // misc
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
});

// 5) Merge precedence: defaults < process.env < flags
const merged = {
  ...defaults,
  ...process.env,
  PORT: argv.port ?? process.env.PORT ?? defaults.PORT,
  LOG_LEVEL: (argv['log-level'] as string | undefined) ?? process.env.LOG_LEVEL ?? defaults.LOG_LEVEL,
  READ_ONLY: argv['read-only'] ?? process.env.READ_ONLY ?? false
};

const parsed = Env.safeParse(merged);
if (!parsed.success) {
  console.error('❌ Config error:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// 6) Export a frozen, module-scoped config
export const config = Object.freeze({
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  logLevel: parsed.data.LOG_LEVEL,
  cors: { origin: parsed.data.CORS_ORIGIN },
  db: { url: parsed.data.DATABASE_URL },
  redis: parsed.data.REDIS_URL ? { url: parsed.data.REDIS_URL } : null,
  auth: { jwtSecret: parsed.data.JWT_SECRET },
  flags: {
    enableSignups: parsed.data.ENABLE_SIGNUPS,
    readOnly: parsed.data.READ_ONLY
  }
});
```

**Arguments/parameters explained**

- `dotenv.config({ path, override })`: load local env files (dev/test). In prod, skip or set `override:false` so real envs win.
- `yargs.option(...).parseSync()`: promote ops-friendly **flags** with types/choices.
- `z.coerce.*`: convert env **strings** to numbers/booleans safely.
- `safeParse`: fail **fast** with clear messages.

**Usage**

```ts
import { config } from '@/config/loader';
app.listen(config.port);
if (config.flags.readOnly) app.use((_,res) => res.status(503).json({ error: 'read_only' }));
```

------

## Module-scoped config (don’t pass the world)

```ts
// src/config/slices.ts
import { config } from './loader';
export const httpConfig = Object.freeze({ port: config.port, cors: config.cors });
export const dbConfig   = Object.freeze({ url: config.db.url });
export const authConfig = Object.freeze({ jwtSecret: config.auth.jwtSecret });
```

Inject only the slice you need into modules (HTTP server, DB client, auth).

------

## Secrets strategy (real work)

- **Never** commit secrets. Use:
  - **Kubernetes Secrets / AWS Secrets Manager / SSM Parameter Store / Vault**.
  - Load at boot and map to envs or inject via your container/runtime.
- Mask logs: avoid printing full URLs with passwords; redact `:password@`.
- Rotate: design for restart-on-rotation; live reload of secrets is rare and error-prone.

------

## Feature flags (safe rollout)

- Keep boolean flags in config for **coarse** control.
- For gradual rollout or targeting: integrate a provider (LaunchDarkly/ConfigCat) behind a **FlagProvider** port.

```ts
export interface FlagProvider { isEnabled(key: string, ctx?: Record<string, any>): Promise<boolean> }
```

Cache results for a few seconds to avoid hot-path calls.

------

## Per-environment overrides (without forking code)

- Use **env vars** to switch: `CACHE_TTL=30` (dev) vs `300` (prod).
- For region/tenant-specific behavior, layer a small **lookup** table (JSON) keyed by region/tenant and cache it.

------

## Runtime reloading (only if you must)

Most backends **restart** to apply config—simplest & safest. If you need live reload:

- Keep a **ConfigProvider** with an **atomic, immutable** snapshot.
- Replace the snapshot on change; consumers read via a function, not a global mutable object.

```ts
let current = config; // from loader
export function getConfig() { return current; }
export function setConfig(next: typeof config) { current = Object.freeze(next); }
```

*Still prefer restart for secrets/major toggles.*

------

## Mapping config → dependencies

```ts
// db.ts
import { Pool } from 'pg';
import { dbConfig } from '@/config/slices';
export const pg = new Pool({ connectionString: dbConfig.url });

// logger.ts
import pino from 'pino';
import { config } from '@/config/loader';
export const log = pino({ level: config.logLevel });
```

------

## Multi-tenant / per-request config

- Compute a **request-scoped** view:

```ts
export function tenantConfig(tenantId: string) {
  // pull from a cached table or env map
  return { uploadBucket: `tenant-${tenantId}`, maxUsers: 50 };
}
```

- Pass it explicitly to use cases that need it. **Don’t** read global state based on `req.headers` deep inside business code.

------

## Common pitfalls (and fixes)

- **Sprinkled `process.env` accesses** → untyped, hard to test. *Centralize in loader + slices.*
- **Booleans as strings** (`'false'` truthy) → use `z.coerce.boolean()`.
- **Secrets in logs** → redact URLs or split credentials.
- **Different configs in tests** → load once (test `.env`) or inject via DI for deterministic tests.
- **Reloading `.env` in prod** → avoid; let the platform set envs and **restart**.

------

## Quick `.env.example` (document required vars)

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://user:pass@localhost:5432/app
JWT_SECRET=change-me-32+chars
CORS_ORIGIN=http://localhost:5173
ENABLE_SIGNUPS=true
REDIS_URL=
```

------

## CLI flags you’ll actually use

- `--port` (temporary override)
- `--log-level` (debug prod issues)
- `--read-only` (maintenance mode)
- `--migrate` (run db migrations then exit)

Wire them in a dedicated bootstrap script:

```ts
if ((argv as any).migrate) {
  await migrate(); process.exit(0);
}
```

------

## ✅ Interview Tips

- “I keep a **single typed config** with **clear precedence**: defaults < files < env < flags.”
- “Secrets come from the **platform/secret manager**; I don’t load `.env` in prod.”
- “Modules get **sliced config** (HTTP/DB/auth) instead of the whole object.”
- “I **coerce & validate** with Zod and **fail fast** on startup.”
- “If dynamic flags are needed, I wrap a **FlagProvider** and cache values.”

------

Next up: **error-handling-patterns.md**?