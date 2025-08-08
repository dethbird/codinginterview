**transform-streams.md**

# Transform Streams (build your own, safely)

## 📌 What & why

A **Transform** stream is a duplex stream that **reads**, **processes**, and **writes** data. It’s the backbone of ETL-style work in Node: parse → validate → enrich → encode — all with **backpressure**.

Use a Transform when you must **modify** data in-flight (compress, line-split, JSON parse/format, redact PII, throttle, etc.).

------

## Core API (constructor options & methods)

```js
import { Transform } from 'node:stream';

class MyTransform extends Transform {
  constructor(opts = {}) {
    super({
      readableObjectMode: false, // output bytes by default
      writableObjectMode: false, // input bytes by default
      highWaterMark: 64 * 1024,  // tune for throughput/memory
      ...opts
    });
  }

  _transform(chunk, encoding, callback) {
    // called for each input chunk
    // push() zero or more outputs, then callback(err?)
    try {
      this.push(chunk); // example passthrough
      callback();
    } catch (e) {
      callback(e);
    }
  }

  _flush(callback) {
    // called when input ends — flush any buffered partial data
    callback();
  }
}
```

**Important knobs**

- `objectMode` / `readableObjectMode` / `writableObjectMode`: stream JS objects, not bytes.
- `highWaterMark`: buffer watermark (bytes for byte streams, items for object mode).
- `allowHalfOpen` (rare): keep writable open after readable ends; leave as default unless you know why.

**Never `throw`** inside `_transform` — always call `callback(err)` or `this.destroy(err)`.

------

## Pattern 1: **Line splitter** (handles chunk boundaries)

```js
import { Transform } from 'node:stream';

export class LineSplit extends Transform {
  constructor() { super({ readableObjectMode: true }); this._buf = ''; }
  _transform(chunk, enc, cb) {
    this._buf += chunk.toString('utf8');     // decode safely
    const lines = this._buf.split(/\r?\n/);
    this._buf = lines.pop() ?? '';           // keep last partial line
    for (const line of lines) this.push(line);
    cb();
  }
  _flush(cb) { if (this._buf) this.push(this._buf); cb(); }
}
```

**Why:** Network/file chunks rarely align to line breaks. Buffer the tail and flush it.

------

## Pattern 2: **JSONL parser** (bytes → objects)

```js
import { Transform } from 'node:stream';
import { LineSplit } from './LineSplit.js';

export const parseJsonl = new Transform({
  readableObjectMode: true, writableObjectMode: true,
  transform(line, _enc, cb) {
    try { this.push(JSON.parse(line)); cb(); }
    catch (e) { cb(Object.assign(new Error('bad json'), { cause: e, line })); }
  }
});
// usage: rs (utf8) → LineSplit → parseJsonl → object consumer
```

------

## Pattern 3: **Redact PII** (object → object, schema-lite)

```js
import { Transform } from 'node:stream';

export function redactFields(fields = ['email', 'phone']) {
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(obj, _e, cb) {
      for (const f of fields) if (f in obj) obj[f] = '[REDACTED]';
      this.push(obj); cb();
    }
  });
}
```

------

## Pattern 4: **Batcher** (group N items or flush on time)

```js
import { Transform } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';

export function batcher({ size = 500, ms = 1000 } = {}) {
  let buf = []; let timer = null; let push; let ended = false;

  const flush = (self, cb) => {
    if (!buf.length) return cb();
    self.push(buf); buf = []; cb();
  };

  const t = new Transform({
    readableObjectMode: true, writableObjectMode: true,
    async _transform(obj, _e, cb) {
      buf.push(obj);
      if (!timer) {
        timer = sleep(ms).then(() => { timer = null; if (!ended) flush(this, () => {}); });
      }
      if (buf.length >= size) await flush(this, () => {}); // sync enough
      cb();
    },
    async _flush(cb) { ended = true; await flush(this, () => {}); cb(); }
  });

  return t;
}
// usage: objects → batcher({ size: 100 }) → bulk insert to DB
```

------

## Pattern 5: **Concurrency-limited async transform** (I/O per item)

```js
import { Transform } from 'node:stream';

export function asyncMapTransform(worker, limit = 8) {
  let active = 0, queue = []; let finalCb;
  return new Transform({
    objectMode: true,
    transform(chunk, _e, cb) {
      const run = () => {
        active++;
        Promise.resolve(worker(chunk))
          .then((out) => { if (out !== undefined) this.push(out); })
          .then(() => { active--; (queue.shift() || cb)(); if (finalCb && active === 0) finalCb(); })
          .catch((e) => this.destroy(e));
      };
      (active < limit) ? run() : queue.push(run); cb = () => {};
    },
    final(cb) { finalCb = cb; if (active === 0) cb(); }
  });
}
// usage: src(objects) → asyncMapTransform(enrich, 5) → sink
```

**Why:** Don’t blast your DB or partner API; bound concurrency.

------

## Pattern 6: **CSV encode** (object → CSV line)

```js
import { Transform } from 'node:stream';

export function toCsv(fields) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return new Transform({
    writableObjectMode: true,
    transform(obj, _e, cb) { this.push(fields.map(f => esc(obj[f])).join(',') + '\n'); cb(); }
  });
}
```

------

## Pattern 7: **Header/footer** (add once at start/end)

```js
import { Transform } from 'node:stream';

export function addHeaderFooter({ header = '', footer = '' } = {}) {
  let started = false;
  return new Transform({
    transform(chunk, _e, cb) {
      if (!started && header) { this.push(header); started = true; }
      this.push(chunk); cb();
    },
    flush(cb) { if (footer) this.push(footer); cb(); }
  });
}
```

------

## Pattern 8: **Throttle bytes/sec** (protect downstream)

```js
import { Transform } from 'node:stream';
export function throttleBps(bps) {
  let windowStart = Date.now(), sent = 0;
  return new Transform({
    transform(chunk, _e, cb) {
      const now = Date.now();
      if (now - windowStart >= 1000) { windowStart = now; sent = 0; }
      sent += chunk.length;
      const over = sent - bps;
      if (over > 0) setTimeout(() => cb(null, chunk), over * (1000 / bps));
      else cb(null, chunk);
    }
  });
}
```

------

## End-to-end example: **JSONL → redact → batch → CSV.gz**

```js
import fs from 'node:fs';
import zlib from 'node:zlib';
import { pipeline as pipeP } from 'node:stream/promises';
import { LineSplit } from './LineSplit.js';
import { parseJsonl } from './parseJsonl.js';
import { redactFields } from './redact.js';
import { batcher } from './batcher.js';
import { toCsv } from './toCsv.js';

await pipeP(
  fs.createReadStream('users.jsonl', { encoding: 'utf8' }),
  new LineSplit(),
  parseJsonl,
  redactFields(['email']),
  batcher({ size: 1000 }),
  // turn batches back into lines:
  new (class extends Transform { constructor(){ super({ objectMode: true }); } _transform(batch,_e,cb){ for (const r of batch) this.push(r); cb(); } })(),
  toCsv(['id','name','email']),
  zlib.createGzip({ level: 6 }),
  fs.createWriteStream('users.csv.gz', { flags: 'w' })
);
```

------

## Error handling & cleanup (must-know)

- Use **`pipeline`** (or `stream/promises`) to centralize errors/closure.
- In `_transform`, call **`cb(err)`** or `this.destroy(err)`; don’t `throw`.
- In `_flush`, guard against leftover partial state.
- If you push **objects** and later bytes, set `readableObjectMode` accordingly or convert consistently.
- If you implement timers inside a Transform (e.g., batcher), **clear them** in `_final`/`_destroy` to avoid leaks.

------

## Performance tuning

- Raise `highWaterMark` for high-throughput byte transforms (e.g., 256 KiB–1 MiB).
- Keep transforms **stateless** when possible (easier backpressure and parallelization).
- Convert to **object mode** only when necessary; object mode has higher overhead.
- Prefer **Buffer** operations to string concat in hot loops.

------

## ✅ Interview Tips

- Explain chunk boundary handling (buffer tail, flush in `_flush`).
- Show **object mode** vs byte mode and when to use each.
- Demonstrate a **concurrency-limited** async transform to protect downstream systems.
- Mention **`pipeline`** and proper error propagation/cleanup.

------

Next: **csv-jsonl-examples.md** (practical recipes: CSV→JSONL, JSONL→CSV, selective columns, schema validation, and large-file strategies).