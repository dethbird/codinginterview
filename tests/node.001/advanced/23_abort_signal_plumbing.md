# 23) Graceful Abort with AbortSignal Across Layers

**Goal:** Thread an AbortSignal through layers; all layers cancel promptly.

### 💎 Gold answer (`abort-plumb.js`)
```js
'use strict';

const http = require('http');
const { setTimeout: sleep } = require('timers/promises');

function abortError() { const e = new Error('Aborted'); e.name='AbortError'; return e; }

async function dbCall(query, { signal }) {
  for (let i = 0; i < 5; i++) {
    if (signal?.aborted) throw abortError();
    await sleep(50, null, { signal }).catch(() => { throw abortError(); });
  }
  return { rows: [1,2,3] };
}

async function workerTask(payload, { signal }) {
  // simulate CPU chunks with cooperative yields
  for (let i = 0; i < 1e6; i++) {
    if ((i & 0x3fff) === 0) {
      if (signal?.aborted) throw abortError();
      await new Promise(r => setImmediate(r));
    }
  }
  return { ok: true };
}

async function httpGet(url, { signal }) {
  const fetch = globalThis.fetch || (await import('node-fetch')).default;
  const res = await fetch(url, { signal });
  return res.text();
}

async function handler(req, res) {
  const ac = new AbortController();
  const signal = ac.signal;
  req.on('close', () => ac.abort('client disconnected'));

  try {
    const [db, wk, txt] = await Promise.all([
      dbCall('select 1', { signal }),
      workerTask({}, { signal }),
      httpGet('https://example.com', { signal })
    ]);
    res.end(JSON.stringify({ db, wk, len: txt.length }));
  } catch (e) {
    const status = e.name === 'AbortError' ? 499 : 500;
    res.statusCode = status; res.end(e.name);
  }
}

http.createServer(handler).listen(3000, () => console.log('abort plumb :3000'));
```

### Notes
- Use `{ signal }` with timers (`timers/promises`), fetch, and custom loops.
- Map aborts to a specific error class/name for consistent handling.
