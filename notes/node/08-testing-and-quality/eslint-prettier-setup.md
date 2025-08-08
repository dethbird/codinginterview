**eslint-prettier-setup.md**

# ESLint & Prettier Setup (Node + TypeScript)

## 📌 What & why

- **ESLint** = catches **bugs & code smells** (unused vars, wrong async, import mistakes).
- **Prettier** = **opinionated formatter** (whitespace/quotes/commas).
   Keep them **separate**: ESLint for correctness, Prettier for style. Disable ESLint’s formatting rules so the tools don’t fight.

------

## Install (Node + TS baseline)

```bash
# Lint core
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Helpful plugins
npm i -D eslint-plugin-import eslint-plugin-promise eslint-plugin-n

# Prettier + bridge
npm i -D prettier eslint-config-prettier

# (Optional, nice import ordering)
npm i -D eslint-plugin-simple-import-sort

# If you test with Vitest or Jest (optional)
npm i -D eslint-plugin-vitest @types/jest
```

**What these do**

- `@typescript-eslint/*`: TS parser + TS-specific rules (e.g., `no-floating-promises`).
- `eslint-plugin-import`: import correctness/order, unresolved paths.
- `eslint-plugin-n`: Node runtime pitfalls (deprecated `fs.promises` patterns, etc.).
- `eslint-plugin-promise`: missing `.catch`, misuse of async.
- `eslint-config-prettier`: **turns off** ESLint rules Prettier would change.
- `eslint-plugin-simple-import-sort`: auto-sorts imports (fast, low-drama).

------

## Prettier config (keep it small)

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
# .prettierignore
dist
coverage
*.log
```

------

## Type-aware linting tsconfig (faster & safer)

Create a **tsconfig for ESLint** so type-aware rules don’t scan node_modules.

```json
// tsconfig.eslint.json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

------

## Option A — ESLint **Flat Config** (ESLint 9+)

```js
// eslint.config.mjs
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import promise from 'eslint-plugin-promise';
import n from 'eslint-plugin-n';
import simpleSort from 'eslint-plugin-simple-import-sort';
import prettier from 'eslint-config-prettier';

export default [
  // Base JS rules + Node globals
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    }
  },

  // TypeScript (type-checked set)
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        project: './tsconfig.eslint.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname
      }
    }
  })),

  // Plugins & project rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
      promise,
      n,
      'simple-import-sort': simpleSort
    },
    rules: {
      // Promises & async
      '@typescript-eslint/no-floating-promises': 'error',
      'promise/catch-or-return': 'warn',
      'promise/no-return-wrap': 'warn',

      // Imports
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'simple-import-sort/exports': 'warn',
      'simple-import-sort/imports': [
        'warn',
        { groups: [['^node:', '^@?\\w'], ['^@/'], ['^\\.\\.?(\\/.*)?$']] }
      ],

      // Node
      'n/no-missing-import': 'off', // TS handles this
      'n/no-unsupported-features/node-builtins': 'off',

      // Stylistic rules turned off; Prettier handles formatting
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off'
    }
  },

  // Tests
  {
    files: ['tests/**/*.ts'],
    plugins: { vitest: (await import('eslint-plugin-vitest')).default },
    languageOptions: {
      globals: (await import('globals')).default.vitest
    },
    rules: { 'vitest/no-focused-tests': 'error' }
  },

  // Disable formatting conflicts last
  prettier
];
```

**Notes**

- `recommendedTypeChecked` enables powerful TS rules (needs `parserOptions.project`).
- We explicitly group imports: node/third-party → internal alias (`@/`) → relative.
- `prettier` last → disables conflicting style rules.

------

## Option B — Legacy `.eslintrc` (ESLint 8, still common)

```js
// .eslintrc.cjs
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  env: { node: true, es2022: true },
  plugins: [
    '@typescript-eslint',
    'import',
    'promise',
    'n',
    'simple-import-sort'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'plugin:n/recommended',
    'prettier' // keep LAST
  ],
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    'promise/always-return': 'off',
    'import/no-unresolved': 'error',
    'simple-import-sort/imports': ['warn', { groups: [['^node:', '^@?\\w'], ['^@/'], ['^\\.']] }],
    'simple-import-sort/exports': 'warn'
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      plugins: ['vitest'],
      env: { 'vitest-globals/env': true }, // alt: set globals via plugin docs
      rules: { 'vitest/no-focused-tests': 'error' }
    }
  ]
};
// .eslintignore
dist
coverage
node_modules
```

------

## NPM scripts (lint, format, fix, CI)

```json
// package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\""
  }
}
```

- `--max-warnings=0` makes **warnings fail CI** (strict but effective).
- `format:check` is great for CI to ensure devs ran Prettier.

------

## Path aliases (TS + ESLint + tests)

If you use `@/*` imports, add to **tsconfig** and ensure resolver is happy:

```json
// tsconfig.json (snippet)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

With the simple sorter we don’t need resolver config; if you rely on `eslint-plugin-import`’s resolver, also:

```bash
npm i -D eslint-import-resolver-typescript
// .eslintrc.cjs (settings)
settings: {
  'import/resolver': {
    typescript: { project: './tsconfig.eslint.json' }
  }
}
```

------

## Real-world quality rules you’ll actually keep

```js
// Add these under "rules"
'no-console': ['warn', { allow: ['warn', 'error'] }],
'no-restricted-imports': [
  'error',
  {
    paths: [
      { name: 'lodash', message: 'Import only what you need, e.g. lodash/isEqual' }
    ],
    patterns: ['../*/*'] // discourage deep relative climbs
  }
],
'@typescript-eslint/explicit-function-return-type': 'off', // keep DX nice
'@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
'@typescript-eslint/require-await': 'error'
```

**Why**

- Catch stray `console.log` in PRs.
- Keep imports tidy and avoid deep relative spaghetti.
- Type-only imports reduce emitted JS churn and circular deps.

------

## Husky + lint-staged (optional but very useful)

```bash
npm i -D husky lint-staged
npx husky init
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json,yml,yaml}": ["prettier --write"]
  }
}
# .husky/pre-commit
npx lint-staged
```

*Prevents messy commits; runs fast only on changed files.*

------

## Editor config (consistency across IDEs)

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

------

## Troubleshooting (you’ll hit these)

- **“Parsing error: Cannot read file tsconfig.json”**
   → Set `parserOptions.project: './tsconfig.eslint.json'` and ensure that file **exists** and includes your sources.
- **ESLint slow**
   → Use the separate `tsconfig.eslint.json`; avoid globs like `**/*` in giant repos; run `eslint src tests`.
- **Prettier vs ESLint fighting**
   → Ensure `eslint-config-prettier` is **last** in `extends` (or in flat config array). Don’t install the old `prettier/eslint-plugin-prettier` unless you want format diffs as ESLint errors.
- **Unresolved imports for `@/…`**
   → Set `paths` in `tsconfig.json` and (if using import plugin resolver) install `eslint-import-resolver-typescript`.
- **Node globals missing (`process`, `__dirname`)**
   → Add `globals.node` (flat) or `env: { node: true }` (.eslintrc).

------

## ✅ Interview Tips

- Explain **ESLint ≠ Prettier**: lint logic, format style; disable conflicting style rules via `eslint-config-prettier`.
- Mention **type-aware rules** with `parserOptions.project` and why you use a separate `tsconfig.eslint.json`.
- Show **import sorting**, **no-floating-promises**, and **promise** rules as examples that catch real bugs.
- Describe your **CI scripts** (`lint`, `format:check`) and optional **pre-commit** with lint-staged.
- Call out **flat config vs .eslintrc**; you can work with either depending on repo age.

------

Next: **09-logging-and-monitoring/pino-winston.md** or want to jump elsewhere?