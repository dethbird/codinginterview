# 11) Event Loop Delay Budgeter (per request)

**Goal:** Cooperatively yield with `setImmediate` when a request exceeds slice time; 503 if over budget.

### 💎 Gold answer (`budgeter.js`)
```js
'use strict';
const http = require('http');

http.createServer(async (req, res) => {
  let budgetMs = Number(process.env.BUDGET_MS || 30);
  let sliceMs = Number(process.env.SLICE_MS || 8);
  let spent = 0;
  let last = Date.now();

  function maybeYield() {
    const now = Date.now();
    const delta = now - last;
    last = now;
    spent += delta;
    if (delta >= sliceMs) {
      return new Promise(r => setImmediate(r));
    }
    return null;
  }

  for (let i = 0; i < 1e7; i++) {
    // do some CPU work
    Math.imul(i, i);
    if ((i & 0x3fff) === 0) {
      if (spent > budgetMs) {
        res.statusCode = 503;
        return res.end('busy');
      }
      const y = maybeYield();
      if (y) await y;
    }
  }

  res.end('done');
}).listen(3000, () => console.log('budgeter on :3000'));
```

### Notes
- Uses periodic checkpoints to avoid per-iteration overhead.
- `Date.now()` jumps are amortized by frequent checks; you can swap to `perf_hooks.performance.now()` if desired.
