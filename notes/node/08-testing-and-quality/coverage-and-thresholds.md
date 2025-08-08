**coverage-and-thresholds.md**

# Test Coverage & Thresholds (Jest/Vitest + CI gating)

## 📌 What & why

Coverage tells you **how much** of your code was executed by tests (not that it’s correct). Use it to:

- prevent “ghost code” (unused branches),
- catch risky, untested hot paths,
- gate PRs so coverage doesn’t **drift down**.

Aim for **meaningful** thresholds (e.g., 85–95% lines) and allow carve-outs for generated or glue code.

------

## Coverage types (know these)

- **Lines**: executed lines of code.
- **Statements**: executed statements (slightly different from lines).
- **Functions**: executed function bodies.
- **Branches**: if/else, switch, ternaries, optional chaining — most valuable for logic.

------

## Vitest: configuration that actually ships

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',                     // fast, no instrumentation step
      reporter: ['text', 'html', 'lcov'], // lcov → CI services; html → local report
      reportsDirectory: './coverage',
      all: true,                          // include files not touched by tests
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__mocks__/**',
        'src/**/types.ts',
        'src/**/*.d.ts',
        'src/**/migrations/**',
        'src/**/generated/**'
      ],
      thresholds: {                       // global gates
        lines: 90, functions: 90, branches: 80, statements: 90
      },
      perFile: true                       // fail if any single file drops below thresholds
    }
  }
});
```

**Notes / parameters**

- `provider: 'v8'` uses native V8 counters (fast). Needs **TS sourcemaps** to map lines correctly — enable `"sourceMap": true` in `tsconfig.json`.
- `all: true` + `include` ensures untested files are counted (no free passes).
- `perFile: true` prevents one giant file from tanking quality unnoticed.

**Scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:cov": "vitest run --coverage",
    "cov:open": "xdg-open coverage/index.html || open coverage/index.html"
  }
}
```

------

## Jest: configuration that doesn’t fight ESM/TS

```ts
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true }] },

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!src/**/migrations/**',
    '!src/**/generated/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  // Optional: use v8 provider in newer Jest versions
  // coverageProvider: 'v8',
  coverageThreshold: {
    global: { lines: 90, statements: 90, functions: 90, branches: 80 },
    // tighten hot spots or allow exceptions per file/folder:
    // "./src/routes/": { branches: 85 },
    // "./src/utils/math.ts": { lines: 100, branches: 100 }
  },
  clearMocks: true,
  restoreMocks: true
};
export default config;
```

**Notes / parameters**

- `collectCoverageFrom` counts files not imported in tests (important).
- `coverageThreshold` supports **per-path overrides** (string keys).
- For accurate TS line mapping, ensure `ts-jest` sourcemaps are enabled (default).

------

## Monorepo / multi-package coverage (merge LCOVs)

**Per package scripts**

```json
{ "scripts": { "test:cov": "vitest run --coverage", "posttest:cov": "cp coverage/lcov.info ../../coverage/pkg-a.lcov" } }
```

**Root script to merge**

```bash
npm i -D lcov-result-merger
npx lcov-result-merger 'coverage/*.lcov' 'coverage/lcov.info'
```

Upload the merged `coverage/lcov.info` to your CI reporter (Codecov/Coveralls) or store as artifact.

------

## CI gating (GitHub Actions example)

```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  node:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run test:cov
      - name: Upload HTML coverage as artifact
        if: failure() || success()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-html
          path: coverage/
```

**How gating works**

- Vitest/Jest **exit non-zero** if thresholds aren’t met → PR status fails.
- Keep thresholds realistic; adjust **per file** for tricky adapters or generated code instead of watering down global gates.

------

## Excluding or justifying low-value code

Sometimes coverage adds little value (generated clients, tiny index files). Use ignore comments *surgically*:

- **c8/Vitest**:

  ```ts
  /* c8 ignore next 3 */
  if (process.env.NODE_ENV !== 'production') {
    debugInit();
  }
  // or block:
  /* c8 ignore start */
  // noisy, non-critical logging branch...
  /* c8 ignore end */
  ```

- **Istanbul/Jest**:

  ```ts
  /* istanbul ignore next */
  const neverCalledInProd = () => { /* ... */ };
  ```

Prefer refactoring over ignoring when possible (split side-effectful code from logic so logic is easily testable).

------

## Getting meaningful branch coverage

### Example: exercise both branches

```ts
export function formatName(u: { name?: string; email: string }) {
  return u.name ? u.name : u.email.split('@')[0];
}
it('uses fallback when name missing', () => {
  expect(formatName({ email: 'alice@example.com' })).toBe('alice');
});
it('uses name when present', () => {
  expect(formatName({ name: 'Alice', email: 'x@y' })).toBe('Alice');
});
```

### Example: error paths (throw/catch)

```ts
export function parseJSON(s: string) {
  try { return JSON.parse(s); }
  catch { return null; }
}
it('returns null on bad JSON', () => {
  expect(parseJSON('nope')).toBeNull();
});
```

------

## Source maps & TS (avoid “off-by-lines”)

- `tsconfig.json`:

  ```json
  { "compilerOptions": { "sourceMap": true, "inlineSources": true } }
  ```

- Don’t transpile twice. If using Babel + ts-jest/Vite, ensure only one tool handles TS.

- For Vitest, Vite + esbuild handles TS; sourcemaps “just work” with `provider:'v8'`.

------

## Pragmatic coverage policy (what I’d say in an interview)

- Target **90% lines/functions**, **80% branches** globally, **per-file** checks on hot modules.
- **Do not chase 100%**—it can encourage testing trivia. Cover **logic** and **error paths**.
- Exclude **generated**, **migrations**, **type decls**. Add **narrow per-path overrides** for adapters.
- Gate in CI so regressions fail fast; publish HTML report for easy local triage.

------

## Quick commands (cheat sheet)

```bash
# Vitest
npm run test:cov
# View HTML report
open coverage/index.html

# Jest
npm run test:cov
open coverage/lcov-report/index.html
```

------

## Troubleshooting

- **Coverage zero for TS files** → check sourcemaps + `include/collectCoverageFrom`.
- **Uncovered files not counted** → set `all: true` (Vitest) or use `collectCoverageFrom` (Jest).
- **Weird line numbers** → duplicate transpilation; remove extra Babel step or align configs.
- **Slow with coverage on** → run unit tests without coverage on each push, enable coverage on PR/CI, or scope with `--changed`.

------

## ✅ Interview Tips

- Explain **what coverage is and isn’t** (execution ≠ correctness).
- Show **config** with thresholds and **per-file** gates.
- Mention **lcov** for CI and how you **merge** coverage in monorepos.
- Demonstrate **ignore comments** sparingly and justify exclusions.
- Emphasize testing **branches & error paths**, not just happy flows.

------

Next up: **eslint-prettier-setup.md**?