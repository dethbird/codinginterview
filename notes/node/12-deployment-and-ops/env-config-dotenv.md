**env-config-dotenv.md**

# Environment Config & dotenv (12-factor style)

## 📌 What & why

Your app should get all configuration from **environment variables** (12-factor). In Node, use **dotenv** to load variables from a local `.env` file in dev/test, **validate** them, and expose a typed, read-only `config` object. In prod, envs come from the platform (Docker/K8s/CI) — you typically **don’t** ship a `.env` file.

------

## Install & basic usage

```bash
npm i dotenv
# optional helpers
npm i zod dotenv-expand
// EASIEST: autoload .env on process start (dev only)
import 'dotenv/config'; // loads .env from CWD
```

**`dotenv.config(options)` arguments**

- `path`: custom file path (`.env.production.local`)
- `encoding`: file encoding (`'utf8'`)
- `debug`: log what’s happening
- `override`: if true, values from file **override** existing `process.env`
- (rare) `processEnv`: custom target object instead of `process.env`

------

## File conventions you’ll actually use

```
.env                 # shared defaults (NEVER commit secrets)
.env.local           # developer machine overrides (gitignored)
.env.development     # dev server defaults
.env.test            # test runner defaults
.env.production      # production defaults (usually empty; platform provides real values)
```

> Load order = base → env-specific → local. **Don’t** commit real secrets; commit a **.env.example**.

------

## Realistic, typed config module (copy/paste)

```ts
// src/config/index.ts
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { z } from 'zod';

// 1) Load .env files in sensible order (dev/test only)
// In prod, rely on real env vars and skip file loads.
if (process.env.NODE_ENV !== 'production') {
  const envName = process.env.NODE_ENV || 'development';
  // Example resolution chain
  for (const file of [`.env.${envName}.local`, `.env.${envName}`, `.env.local`, `.env`]) {
    const res = dotenv.config({ path: file });
    if (res.parsed) dotenvExpand.expand(res); // enables VAR_A=${VAR_B}
  }
}

// 2) Define schema (types + defaults + coercions)
const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),

  // Feature flags (booleans are strings in env → coerce)
  ENABLE_SIGNUPS: z.coerce.boolean().default(true),

  // Optional stuff
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const env = parsed.data;

// 3) Export an immutable config object for app use
export const config = Object.freeze({
  env: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  db: { url: env.DATABASE_URL },
  cors: { origin: env.CORS_ORIGIN },
  auth: { jwtSecret: env.JWT_SECRET },
  flags: { enableSignups: env.ENABLE_SIGNUPS },
  redis: { url: env.REDIS_URL },
  sentryDsn: env.SENTRY_DSN
});
```

Usage:

```ts
import { config } from '@/config';
app.listen(config.port);
```

**Why this pattern**

- **Single import** for all config (no scattering `process.env.X`).
- **Validated & typed** once at startup → fast failures.
- **Frozen** so it can’t drift at runtime.

------

## Variable expansion (handy in monorepos)

```env
# .env
PUBLIC_URL=https://api.example.com
ASSETS_URL=${PUBLIC_URL}/assets
```

Load with `dotenv-expand` (shown above) so `${PUBLIC_URL}` resolves.

------

## Per-environment overrides (arguments that matter)

```ts
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
dotenv.config({ path: `.env.local`, override: false }); // don’t clobber real envs
```

- In **CI/prod**, skip file loads or set `override: false` so platform envs win.

------

## .env.example (document required vars)

```dotenv
# .env.example — copy to .env and fill locally
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://user:pass@localhost:5432/app
JWT_SECRET=please-change-me-to-a-32+char-random-string
CORS_ORIGIN=http://localhost:5173
ENABLE_SIGNUPS=true
REDIS_URL=redis://localhost:6379
SENTRY_DSN=
```

------

## Cross-platform scripts (Windows/macOS/Linux)

Use **cross-env** to set envs in npm scripts:

```bash
npm i -D cross-env
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "cross-env NODE_ENV=test vitest run"
  }
}
```

------

## Secrets: where to put them (not in git)

- **Local dev**: `.env.local` (gitignored).
- **Docker Compose**: `env_file: .env` or `.env` at project root; secrets via `docker secrets` for sensitive data.
- **Kubernetes**: ConfigMaps (non-secret) + **Secrets** (base64, access-controlled). Mount as envs or files.
- **CI**: store in CI secrets; inject as env during job.
- **Cloud**: use **Secret Manager / Parameter Store / Key Vault**. Optionally pull at boot (and cache).

------

## Validation alternatives (if not using Zod)

- **envalid**:

  ```ts
  import { cleanEnv, num, str, bool, url } from 'envalid';
  const env = cleanEnv(process.env, {
    PORT: num({ default: 3000 }),
    DATABASE_URL: url(),
    JWT_SECRET: str({ desc: '32+ chars' }),
    ENABLE_SIGNUPS: bool({ default: true })
  });
  ```

- **joi**: similar idea; you’ll still coerce.

------

## Testing strategy

- Keep a dedicated **`.env.test`**.
- Tests should **not** read developer secrets; inject deterministic URLs/keys.
- For HTTP tests, set `NODE_ENV=test` and a **throwaway DB** (`DATABASE_URL=postgres://..._test`).
- If doing “transaction per test”, reuse the same DB URL; otherwise run ephemeral containers (Testcontainers).

------

## Production notes (what trips people)

- **Don’t load `.env` in prod**; rely on real env injection. If you must, mount a file at deploy and load it with `override: false`.
- **Numbers & booleans** in env are **strings** — always **coerce** (`z.coerce.number()`, `z.coerce.boolean()`).
- **Process restart needed** for changes; config is frozen at boot.
- **Don’t** read `process.env` all over; it breaks typing & testability.
- **Never log secrets**; mask values (e.g., show only last 4 chars).

------

## Example: Express CORS, DB, and feature flags wired to config

```ts
import cors from 'cors';
import { config } from '@/config';
import { Pool } from 'pg';

app.use(cors({ origin: config.cors.origin, credentials: true }));

export const pool = new Pool({ connectionString: config.db.url });

app.post('/signup', (req, res) => {
  if (!config.flags.enableSignups) return res.status(403).json({ error: 'signups_disabled' });
  // proceed…
});
```

------

## Docker & Compose (env injection)

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    # or:
    # env_file: ./.env.production
```

------

## Kubernetes (typical manifest bits)

```yaml
envFrom:
  - configMapRef: { name: api-config }  # non-secret config
  - secretRef: { name: api-secrets }    # sensitive; base64-encoded values
```

------

## Common pitfalls & fixes

- “`DATABASE_URL` missing” → **validate** at startup; fail fast with clear message.
- “Boolean always true” → you compared string: `'false'` is truthy. **Coerce** to boolean.
- “Local overrides prod envs” → you loaded `.env` with `override:true`. Set `override:false` in prod or skip loading.
- “Paths don’t expand” → add **dotenv-expand** if you need `${VAR}` references.
- “Different configs in unit tests” → isolate by loading config **once**, before tests; or inject via DI for units.

------

## Quick cheat sheet

```ts
// Load envs (dev only), expand refs
const r = dotenv.config({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
dotenvExpand.expand(r);

// Validate & coerce
const Env = z.object({ PORT: z.coerce.number().default(3000) /* … */ });
const env = Env.parse(process.env);

// Export frozen config
export const config = Object.freeze({ port: env.PORT });
```

------

## ✅ Interview Tips

- “I keep config **in env vars**, validated at startup (Zod/envalid), then export a **frozen** typed object.”
- “In prod I **don’t load `.env`**; I rely on the platform to inject envs.”
- “I use **dotenv-expand** for references, **.env.example** for docs, and **.env.test** for testing.”
- “I coerce env strings to **numbers/booleans**, and I **fail fast** when required vars are missing.”