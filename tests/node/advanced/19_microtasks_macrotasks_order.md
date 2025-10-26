# 19) Precise Control of Microtasks vs Macrotasks

**Goal:** Schedule tokens to observe ordering across Node versions.

### 💎 Gold answer (`task-order.js`)
```js
'use strict';

function schedule(trace) {
  trace.push('sync-start');

  process.nextTick(() => trace.push('nextTick-1'));
  queueMicrotask(() => trace.push('microtask-1'));

  setTimeout(() => trace.push('timeout-0'), 0);
  setImmediate(() => trace.push('immediate-1'));

  Promise.resolve().then(() => trace.push('promise-then'));

  process.nextTick(() => {
    trace.push('nextTick-2');
    queueMicrotask(() => trace.push('microtask-2'));
  });

  trace.push('sync-end');
}

module.exports = { schedule };

// Harness
if (require.main === module) {
  const t = [];
  schedule(t);
  setImmediate(() => {
    console.log(t);
    // Expected (Node typical):
    // ['sync-start','sync-end','nextTick-1','nextTick-2','microtask-1','promise-then','microtask-2','timeout-0','immediate-1']
  });
}
```

### Notes
- `process.nextTick` runs **before** other microtasks in Node.
- `setImmediate` fires after the poll phase; `setTimeout(0)` is scheduled for timers phase (often before `setImmediate`).
