**mocking-and-test-doubles.md**

# Mocking & Test Doubles (stubs, spies, fakes) for Node + TS

## 📌 What & why

**Test doubles** help isolate the unit under test by replacing real collaborators (DB, HTTP, time, FS) with controllable stand-ins. Done right, mocks make tests **fast, deterministic, and focused**. Over-mocking hides bugs—mock only **boundaries** (I/O) and keep behavior-heavy code real.

------

## Types of doubles (quick glossary)

- **Dummy**: placeholder value that’s never used.
- **Stub**: returns canned data (no assertions).
- **Spy**: records calls/args; you assert on interactions.
- **Mock**: a spy **with behavior** + expectations (preprogrammed responses).
- **Fake**: working but simplified impl (e.g., in-memory repo).
- **Shim**: thin adapter to match an interface.

> Interview line: “I stub **I/O** (HTTP/DB/time/FS), spy on **collaborations**, and prefer **fakes** for repositories to keep logic real.”

------

## Core APIs you’ll use (Vitest & Jest)

- **Create doubles**: `vi.fn() | jest.fn()` (spy/mock function)
  - Params: optional **implementation** `(…args) => any`
  - Helpers: `.mockResolvedValue(x)`, `.mockRejectedValue(e)`, `.mockImplementation(fn)`
- **Spy on real module/obj**: `vi.spyOn(obj, 'method')` / `jest.spyOn(obj, 'method')`
  - Optional: third arg `'get'|'set'` for accessors
- **Module mock**: `vi.mock('module', factory?)` / `jest.mock('module', factory?)`
  - ESM caveat: hoisted; call **before** importing module under test
- **Reset state**: `vi.resetAllMocks()` / `jest.resetAllMocks()` (implementations + usage)
  - Also: `clearAllMocks()` (history only), `restoreAllMocks()` (restore originals)

------

## Pattern 1 — Function-level DI (simplest & robust)

Pass collaborators as args; replace in tests with stubs/spies.

```ts
// src/services/invoice.ts
type Emailer = (to: string, html: string) => Promise<void>;
export async function sendInvoice(to: string, amount: number, emailer: Emailer) {
  const html = `<p>Amount: ${amount}</p>`;
  await emailer(to, html);
  return { ok: true };
}

// tests/unit/invoice.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sendInvoice } from '@/services/invoice';

it('emails invoice with amount', async () => {
  const emailer = vi.fn<Parameters<any>, ReturnType<any>>().mockResolvedValue(undefined);
  const res = await sendInvoice('a@b.com', 42, emailer);
  expect(res).toEqual({ ok: true });
  expect(emailer).toHaveBeenCalledWith('a@b.com', expect.stringContaining('42'));
});
```

**Why**: no module-mock gymnastics; easy to reason about.

------

## Pattern 2 — Module mocks (when DI isn’t practical)

Replace imported modules (HTTP clients, SDKs, config readers).

```ts
// src/services/tax.ts
import { getRate } from './rates';
export async function calcTax(amount: number, cc: string) {
  const r = await getRate(cc);
  return Math.round(amount * r);
}

// tests/unit/tax.test.ts (Vitest)
import { describe, it, expect, vi } from 'vitest';

// Hoisted mock MUST appear before importing SUT
vi.mock('@/services/rates', () => ({ getRate: vi.fn().mockResolvedValue(0.0825) }));

import { calcTax } from '@/services/tax';
import { getRate } from '@/services/rates';

it('uses mocked rate', async () => {
  await expect(calcTax(1000, 'US-CA')).resolves.toBe(83);
  expect(getRate).toHaveBeenCalledWith('US-CA');
});
```

**Args/params of `vi.mock`/`jest.mock`**

- 1st: module specifier string
- 2nd optional factory returns an object with the **mocked exports**
- If omitted, auto-mock behavior (Jest) tries to fake exports; explicit is clearer.

------

## HTTP mocking (don’t hit the internet)

Use **nock** for Node HTTP; for browser code use **MSW** (Mock Service Worker).

```ts
// tests/http/rates.test.ts
import nock from 'nock';
import { getRate } from '@/services/rates';

it('calls upstream API', async () => {
  nock('https://api.rates.test')
    .get('/v1/rate?cc=US')
    .reply(200, { rate: 0.2 });

  const r = await getRate('US');
  expect(r).toBe(0.2);
  expect(nock.isDone()).toBe(true); // all expectations met
});
```

**Nock params**

- `.reply(status, body, headers?)`
- `.persist()` to keep the interceptor for multiple requests
- `.times(n)` to limit count

------

## Time & randomness (determinism)

Freeze time; seed randomness.

```ts
// Vitest
import { vi } from 'vitest';
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
expect(Date.now()).toBe(new Date('2025-01-01T00:00:00Z').valueOf());
vi.useRealTimers();
// Stub random
const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.1234);
// For uuid libs, mock the module or inject generator
```

------

## FS mocking (no disk writes)

Use **memfs** or **mock-fs** to fake the filesystem.

```ts
// npm i -D memfs
import { vol } from 'memfs';
import * as fs from 'node:fs/promises';

beforeEach(() => vol.reset());
it('writes report to disk', async () => {
  vol.fromJSON({}, '/app');
  await fs.writeFile('/app/out.txt', 'hi');
  expect(await fs.readFile('/app/out.txt', 'utf8')).toBe('hi');
});
```

------

## DB boundaries: fake vs real

- **Unit**: fake repo (in-memory map) or stubbed client methods (`query`, `execute`) returning canned rows.
- **Integration**: real DB with **transaction-per-test** or **truncate** strategy (see `supertest-http-tests.md`).

```ts
// Fake repo
class InMemoryUsers {
  private map = new Map<string, any>();
  async insert(u: any) { this.map.set(u.id, u); return u; }
  async findByEmail(email: string) { return [...this.map.values()].find(u => u.email === email) || null; }
}
```

------

## Environment & config mocking

```ts
const OLD = process.env.API_KEY;
beforeEach(() => { process.env.API_KEY = 'test123'; });
afterEach(() => { process.env.API_KEY = OLD; });
```

For config modules, **mock the module** or export a **function** that reads env at call-time (not import-time).

------

## Partial mocks (keep most real)

```ts
// Keep real module except one function
vi.mock('@/services/payment', async (orig) => {
  const real = await orig.importActual<typeof import('@/services/payment')>();
  return { ...real, chargeCard: vi.fn().mockResolvedValue({ ok: true }) };
});
```

------

## ESM gotchas (common interview tripwire)

- **Hoisting**: `vi.mock/jest.mock` is hoisted; define **before** importing SUT.
- **Top-level `await`**: use dynamic `await import()` after setting up mocks.
- **Default vs named**: ensure your factory returns the correct shape `{ default: … }` for default exports.

```ts
// Dynamic import to apply runtime condition
vi.mock('@/sdk', () => ({ default: vi.fn(() => 'mocked') }));
const { handler } = await import('@/handler'); // after mocks
```

------

## Spies with getters/setters

```ts
const obj = { get value() { return 1; } };
const spy = vi.spyOn(obj, 'value', 'get').mockReturnValue(5);
expect(obj.value).toBe(5);
spy.mockRestore();
```

------

## Reset/cleanup strategy (avoid test bleed)

```ts
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();   // calls history
  vi.resetAllMocks();   // resets implementations to original mock (if mocked)
  vi.restoreAllMocks(); // restores spied originals
});
```

Pick one consistent policy; **restore** when spying on real objects.

------

## When not to mock

- Business logic/pure functions → keep real, test via inputs/outputs.
- Complex ORMs end-to-end → prefer **integration tests** with real DB (fast path via tx rollback).
- Network libraries in E2E → let them call your **local** fake server instead of nock.

------

## Example: Express route with mocked dependencies

```ts
// src/routes/report.ts
import { Router } from 'express';
import { buildReport } from '@/services/reports';
export const router = Router();
router.post('/reports', async (req, res) => {
  const r = await buildReport(req.body.range); // heavy I/O
  res.status(202).json({ id: r.id });
});

// tests/http/report.test.ts
import request from 'supertest';
import { app } from '@/app';

vi.mock('@/services/reports', () => ({
  buildReport: vi.fn().mockResolvedValue({ id: 'r_1' })
}));

it('202 enqueues report', async () => {
  const res = await request(app).post('/reports').send({ range: '30d' }).expect(202);
  expect(res.body.id).toBe('r_1');
});
```

------

## Quick decision chart

- **HTTP to 3rd party?** → `nock` (Node) / `msw` (browser).
- **Time/random?** → fake timers + stub random/uuid.
- **FS?** → `memfs` / `mock-fs`.
- **DB?** → fake repo for unit, real DB for integration.
- **SDK/config?** → module mock or DI.

------

## ✅ Interview Tips

- Define **stub/spy/mock/fake** succinctly and when you use each.
- Show ESM **hoisting** rule and **dynamic import** after `vi.mock`.
- Emphasize mocking only **boundaries**; keep core logic real.
- Mention **nock/MSW**, fake timers, and **transaction-per-test** for DB.
- Explain your **reset/cleanup** policy to avoid flaky cross-test state.

------

Next: **coverage-and-thresholds.md**?