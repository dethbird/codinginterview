**jest-vitest-setup.md**

# Jest & Vitest Setup (Node + TS)

## 📌 What & why

You need fast, reliable tests with **TypeScript**, good **mocks/spies**, and **coverage**.

- **Jest**: batteries-included, mature mocks, tons of guides.
- **Vitest**: lighter, faster, Vite-powered, great DX with ESM/TS; easy in monorepos.

Pick either; both work great for Node APIs and React/TS apps.

------

## Quick decision guide

- **Greenfield / Vite frontends / ESM-first** → **Vitest** (fast, modern).
- **Legacy repos / lots of Jest docs/plugins** → **Jest** (stable choice).
- Doing React? Both integrate with Testing Library; this page focuses on **Node + TS**.

------

## Project layout (suggested)

```
src/
  app.ts           # your express/fastify app
  services/
tests/
  unit/
  integration/
vitest.config.ts or jest.config.ts
tsconfig.json
```

------

## TypeScript config (shared)

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",              // ESM-friendly
    "moduleResolution": "Bundler",   // or "NodeNext" if you prefer
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]               // path alias (map in test config too)
    },
    "types": ["node", "vitest/globals"] // or "jest" (choose one)
  },
  "include": ["src", "tests"]
}
```

------

## Vitest setup (recommended for ESM/Vite stacks)

### Install

```bash
npm i -D vitest @vitest/coverage-v8 tsx
```

### Config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',     // or 'jsdom' for browser-y stuff
    globals: true,           // use `describe/it/expect` without imports
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      lines: 90, functions: 90, branches: 80, statements: 90
    },
    alias: { '@': new URL('./src', import.meta.url).pathname },
    poolOptions: {
      threads: { singleThread: false } // use --single-thread for DB tests
    }
  }
});
```

### NPM scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage"
  }
}
```

### Basic unit test & mocking (Vitest)

```ts
// tests/unit/calc.test.ts
import { vi, expect, it, describe } from 'vitest';
import { calcTax } from '@/services/tax';
import * as rates from '@/services/rates';

describe('calcTax', () => {
  it('uses external rate service', async () => {
    const spy = vi.spyOn(rates, 'getRate').mockResolvedValue(0.2);
    const total = await calcTax(100, 'US');
    expect(total).toBe(20);
    expect(spy).toHaveBeenCalledWith('US');
  });
});
```

### Global setup (dotenv, polyfills, DB urls)

```ts
// tests/setup.ts
import 'dotenv/config';
process.env.NODE_ENV = 'test';

// Optional: reduce log noise
const orig = console.error;
console.error = (...a) => {
  if (String(a[0] ?? '').includes('DeprecationWarning')) return;
  orig(...a);
};
```

------

## Jest setup (solid, battle-tested)

### Install (TypeScript + Node ESM)

```bash
npm i -D jest ts-jest @types/jest
```

### Config (ESM-friendly)

```ts
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm', // ESM + TS via ts-jest
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.jest.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true }] },
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['text', 'html'],
  coverageThreshold: { global: { lines: 90, statements: 90, functions: 90, branches: 80 } },
  clearMocks: true,
  restoreMocks: true
};
export default config;
```

### Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

### Basic unit test & mocking (Jest)

```ts
// tests/unit/calc.test.ts
import { calcTax } from '@/services/tax';
import * as rates from '@/services/rates';

jest.mock('@/services/rates'); // auto-mock module
const mocked = jest.mocked(rates);

test('uses external rate service', async () => {
  mocked.getRate.mockResolvedValue(0.2);
  await expect(calcTax(100, 'US')).resolves.toBe(20);
  expect(mocked.getRate).toHaveBeenCalledWith('US');
});
```

------

## Path aliases (TS ↔ tests)

- **TS**: `paths` in `tsconfig.json`.
- **Vitest**: `alias` in `vitest.config.ts`.
- **Jest**: `moduleNameMapper` in `jest.config.ts`.

------

## Handling ESM/CJS gotchas

- Prefer **ESM everywhere** with `"type":"module"` in `package.json`.
- For Jest, use `ts-jest` ESM preset; avoid Babel unless you need JSX transforms without TS.
- For Vitest, you’re fine—Vite handles ESM well.

------

## Testing env variables

- Keep a `.env.test` with test DB URLs/ports.
- Load via `dotenv/config` in setup.
- Never hit production services; **stub or spin test containers** (see below).

------

## Database testing patterns (realistic)

### Fast pattern: transaction-per-test (Postgres/MySQL)

```ts
// tests/integration/db-setup.ts
import { pool } from '@/db';

export async function beforeEachTx() {
  await pool.query('BEGIN');
}
export async function afterEachTx() {
  await pool.query('ROLLBACK');
}
```

Hook it:

- **Vitest**:

```ts
import { beforeEach, afterEach } from 'vitest';
import { beforeEachTx, afterEachTx } from './db-setup';
beforeEach(beforeEachTx);
afterEach(afterEachTx);
```

- **Jest**:

```ts
beforeEach(beforeEachTx);
afterEach(afterEachTx);
```

> If your code uses a **pool per request**, ensure your app queries use the **same connection** inside the transaction (pass a client or use a DI container). Otherwise use a **test database** and truncate between tests.

### Slower but isolated: Testcontainers (optional)

Spin real DBs in Docker for integration tests; great fidelity, slower startup. (Keep for CI or nightly suite.)

------

## Time, timers, and dates

- **Vitest**:

```ts
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-01'));
vi.advanceTimersByTime(5000);
vi.useRealTimers();
```

- **Jest**:

```ts
jest.useFakeTimers();
jest.setSystemTime(new Date('2025-01-01'));
jest.advanceTimersByTime(5000);
jest.useRealTimers();
```

------

## HTTP testing note

Use **Supertest** to hit your Express app without starting a real port. (Detailed in the next file.)

```ts
// quick taste (works in both):
import request from 'supertest';
import { app } from '@/app';

it('GET /health', async () => {
  const res = await request(app).get('/health').expect(200);
  expect(res.body).toEqual({ ok: true });
});
```

------

## Coverage tips (real work)

- Exclude generated files, type defs, and migrations:
  - **Vitest**: `coverage.exclude: ['**/migrations/**','**/*.d.ts']`
  - **Jest**: `coveragePathIgnorePatterns: ['/node_modules/','/migrations/','\\.d\\.ts$']`
- Gate in CI with thresholds (already in configs above).

------

## Parallelism & flakiness

- Default is parallel. For DB/port-sharing tests, run serial:
  - **Vitest**: `vitest --pool=threads --single-thread` or per-file `test.describe.configure({ mode: 'serial' })`.
  - **Jest**: `--runInBand` or `test.concurrent` for selective parallelism.
- Avoid network timeouts; stub external HTTP or use **nock/msw**.

------

## Example: service unit test (pure logic)

```ts
// src/services/tax.ts
import { getRate } from './rates';
export async function calcTax(amount: number, country: string) {
  const rate = await getRate(country);
  return Math.round(amount * rate);
}
// tests/unit/tax.test.ts (Vitest)
import { vi, expect, it } from 'vitest';
import * as rates from '@/services/rates';
import { calcTax } from '@/services/tax';

it('rounds to nearest cent', async () => {
  vi.spyOn(rates, 'getRate').mockResolvedValue(0.0825);
  expect(await calcTax(999, 'US-CA')).toBe(82); // 999 * 0.0825 = 82.4175 → 82
});
```

------

## Troubleshooting

- **ESM import errors (Jest)** → ensure `preset: 'ts-jest/presets/default-esm'` and `useESM:true`.
- **Path alias not resolved** → align tsconfig `paths` with Jest `moduleNameMapper`/Vitest `alias`.
- **DB tests flaky** → run serial for that suite; wrap each test in a transaction or use a dedicated DB.
- **Long test startup** → lazy-load heavy modules; split unit vs integration; cache TS builds.

------

## ✅ Interview Tips

- Explain your **test pyramid**: lots of **unit**, some **integration**, a few **e2e**.
- Mention **mocks/spies** for logic and **Supertest** for HTTP.
- Show **coverage gating** and **transaction-per-test** DB strategy.
- Call out **ESM/TS** configuration differences between Jest and Vitest.

------

Next up: **supertest-http-tests.md** for full HTTP integration patterns (auth helpers, fixtures, and error cases).