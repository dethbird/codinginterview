**modules-esm-vs-cjs.md**

# Modules: ESM vs CommonJS

## 📌 Definition

Node.js supports **two module systems**:

1. **CommonJS (CJS)** – The original Node.js module system, using `require()` and `module.exports`.
2. **ECMAScript Modules (ESM)** – The standard JavaScript module format, using `import`/`export`.

Both allow you to split code into separate files and reuse it, but they differ in syntax, behavior, and loading.

------

## 🔍 Key Differences

| Feature                | CommonJS (CJS)              | ESM (ECMAScript Modules)                                |
| ---------------------- | --------------------------- | ------------------------------------------------------- |
| Syntax                 | `require`, `module.exports` | `import`, `export`                                      |
| File extension default | `.js`                       | `.mjs` (or `.js` if `"type": "module"` in package.json) |
| Loading                | Synchronous                 | Asynchronous                                            |
| Scope                  | Runs in its own function    | Runs in strict mode by default                          |
| Interop                | Can import ESM (with async) | Can import CJS (default export only)                    |

------

## 📋 CommonJS Syntax

```js
// math.js
function add(a, b) {
  return a + b;
}
module.exports = { add };

// app.js
const { add } = require('./math');
console.log(add(2, 3)); // 5
```

**Parameters/Arguments:**

- `require(path)` → `path` is a string: relative (`'./file'`) or module name (`'lodash'`).

------

## 📋 ESM Syntax

```js
// math.mjs
export function add(a, b) {
  return a + b;
}

// app.mjs
import { add } from './math.mjs';
console.log(add(2, 3)); // 5
```

**Parameters/Arguments:**

- `import` is static — paths must be string literals (except for dynamic `import()`).

------

## 🛠 Real-World Example: Mixed Imports

Sometimes you need to mix module systems when using third-party libraries.

```js
// ESM file importing CJS
import pkg from 'lodash';
const { merge } = pkg;

// CJS file importing ESM (must be dynamic)
(async () => {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch('https://api.example.com/data');
})();
```

------

## ⚡ Migration Tips (CommonJS → ESM)

- Add `"type": "module"` in `package.json` OR rename files to `.mjs`.
- Use `import`/`export` instead of `require`/`module.exports`.
- Replace `__dirname` and `__filename` with:

```js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

------

## ✅ Interview Tips

- Be able to explain **why Node added ESM** (browser compatibility, standardization).
- Know **interop patterns** for old and new code.
- Expect a “convert this CommonJS file to ESM” type of exercise.

------

