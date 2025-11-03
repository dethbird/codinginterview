# 22) ESM/CJS Dual-Export Package Skeleton

**Goal:** `import { x } from 'pkg'` and `const { x } = require('pkg')` both work.

### 💎 Files

**`pkg/src/index.mjs`**
```js
export const x = () => 'hi';
export default { x };
```

**`pkg/src/index.cjs`**
```js
exports.x = () => 'hi';
module.exports.default = { x: exports.x };
```

**`pkg/package.json`**
```json
{
  "name": "pkg",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "exports": {
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs",
    "default": "./dist/index.mjs"
  },
  "files": ["dist"],
  "types": "./dist/index.d.ts"
}
```

**(optional) `pkg/tsconfig.json`**
```json
{
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

### Notes
- Provide both default and named for interop.
- If using TS, emit `index.d.ts` with both named and default.
