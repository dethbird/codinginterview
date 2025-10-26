# 15) Batcher as Async Iterator (time + size)

**Goal:** `batchAsync(source, { size, ms })` yields arrays by size or timeout, cleans timers, and flushes at end.

### 💎 Gold answer (`batch-iter.js`)
```js
'use strict';

async function* batchAsync(source, { size = 50, ms = 200 } = {}) {
  let buf = [];
  let timer = null;
  const startTimer = () => {
    if (ms <= 0 || timer) return;
    timer = setTimeout(() => {
      const toEmit = buf; buf = [];
      timer = null;
      if (toEmit.length) pendingResolve?.(toEmit);
    }, ms);
    timer.unref?.();
  };

  let pendingResolve; // bridge timeout to consumer
  while (true) {
    const nextPromise = source.next ? source.next() : source[Symbol.asyncIterator]().next();
    const race = new Promise((resolve) => (pendingResolve = resolve));
    const res = await Promise.race([nextPromise, race]);
    if (res && typeof res === 'object' && 'done' in res) {
      if (!res.done) {
        buf.push(res.value);
        if (buf.length >= size) {
          clearTimeout(timer); timer = null;
          yield buf; buf = []; 
        } else {
          startTimer();
        }
        continue;
      } else {
        clearTimeout(timer); timer = null;
        if (buf.length) yield buf;
        return;
      }
    } else {
      // got timer flush
      if (res && res.length) yield res;
    }
  }
}

module.exports = { batchAsync };
```

### Notes
- Uses a small internal race to flush on timeout without leaking timers.
- Properly flushes partial final batch on source completion.
