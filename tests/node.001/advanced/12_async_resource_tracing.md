# 12) Async Resource Tracing with async_hooks

**Goal:** Minimal per-request tracer logging async resource init/destroy with ALS correlation.

### 💎 Gold answer (`trace-async.js`)
```js
'use strict';
const http = require('http');
const { createHook, AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

const interesting = new Set(['Timeout', 'PROMISE', 'TCPWRAP', 'GETADDRINFOREQWRAP']);

createHook({
  init(asyncId, type, triggerAsyncId) {
    const ctx = als.getStore();
    if (ctx && interesting.has(type)) {
      console.error(`[${ctx.id}] init ${type} ${asyncId} <- ${triggerAsyncId}`);
    }
  },
  destroy(asyncId) {
    const ctx = als.getStore();
    if (ctx) console.error(`[${ctx.id}] destroy ${asyncId}`);
  }
}).enable();

http.createServer((req, res) => {
  const id = Math.random().toString(36).slice(2);
  als.run({ id }, () => {
    setTimeout(() => res.end('ok'), 50);
  });
}).listen(3000, () => console.log('trace on :3000'));
```
