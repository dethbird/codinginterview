**piping-and-backpressure.md**

# Piping & Backpressure (safe multi-stage streams)

## 📌 What & why

**Piping** connects streams so data flows from a **Readable → (Transforms …) → Writable**.
 **Backpressure** is how a slow consumer tells an upstream producer to **slow down** so you don’t explode memory.

Use **`stream.pipeline`** (or the Promise version) instead of chaining `.pipe()`—it wires **errors & close** correctly across the whole chain.

------

## Core APIs & parameters

### `readable.pipe(destination[, options])`

- **destination**: a Writable/Transform
- **options.end** *(boolean, default `true`)*: call `destination.end()` when source ends
- Returns `destination`

> `.pipe()` handles backpressure between **that pair**, but **does not** propagate errors across a long chain.

### `stream.pipeline(...streams[, callback])`

```js
import { pipeline } from 'node:stream';
pipeline(src, t1, t2, dest, (err) => { /* single error/close callback */ });
```

- **streams**: sequence of Readable/Transform/Writable
- **callback(err?)**: called once on completion or error
- Properly closes **all** streams on error.

### `stream/promises.pipeline(...streams[, options])`

```js
import { pipeline as pipeP } from 'node:stream/promises';
await pipeP(src, t1, t2, dest, { signal }); // supports AbortSignal
```

- **options.signal** *(AbortSignal)*: cancels the whole pipeline
- Returns a Promise that rejects on the **first** error

------

## How backpressure works (in practice)

- `writable.write(chunk)` returns **`false`** when its internal buffer is full.
- A well-behaved producer **pauses** until the consumer emits **`'drain'`**.
- With `.pipe()` / `pipeline()`, this coordination happens **for you** between stages.

**Manual write example (know for interviews):**

```js
function writeAll(writable, chunks) {
  return new Promise((res, rej) => {
    let i = 0;
    function loop() {
      while (i < chunks.length) {
        if (!writable.write(chunks[i++])) return writable.once('drain', loop);
      }
      writable.end();
    }
    writable.on('finish', res).on('error', rej);
    loop();
  });
}
```

------

## Real-world patterns

### 1) Safe multi-stage pipeline with gzip + abort

```js
import fs from 'node:fs';
import zlib from 'node:zlib';
import { pipeline as pipeP } from 'node:stream/promises';

export async function compressFile(srcPath, dstPath, { signal } = {}) {
  const rs = fs.createReadStream(srcPath);
  const gz = zlib.createGzip({ level: 6 });              // params: level 0-9, memLevel, strategy
  const ws = fs.createWriteStream(dstPath, { flags: 'wx' });
  await pipeP(rs, gz, ws, { signal });                   // abort tears down all stages
}
```

**Why:** One place to handle errors; prevents half-written files or leaked FDs.

------

### 2) Transform with proper error handling

```js
import { Transform } from 'node:stream';

const toUpper = new Transform({
  transform(chunk, enc, cb) {
    try {
      const s = chunk.toString('utf8');
      if (s.includes('\u0000')) return cb(new Error('NUL not allowed')); // fail this chunk
      cb(null, s.toUpperCase());
    } catch (e) { cb(e); } // never throw; use cb(err)
  }
});
```

**Why:** Throwing inside `_transform` can crash the process if uncaught; always `cb(err)`.

------

### 3) Parallel-ish transform with limited concurrency

Useful when each chunk triggers async I/O (API/DB) and you want **N at a time**.

```js
import { Transform } from 'node:stream';

function asyncMapTransform(worker, limit = 8) {
  let active = 0, queue = [], done;
  return new Transform({
    objectMode: true,
    transform(chunk, _, cb) {
      const run = () => {
        active++;
        Promise.resolve(worker(chunk))
          .then((out) => { if (out !== undefined) this.push(out); })
          .then(() => { active--; (queue.shift() || cb)(); if (done && active === 0) done(); })
          .catch((e) => this.destroy(e));
      };
      (active < limit) ? run() : queue.push(run), cb = () => {};
    },
    final(cb) { done = () => cb(); if (active === 0) cb(); }
  });
}
```

**Usage (object mode):**

```js
await pipeP(srcReadable, asyncMapTransform(fetchAndEnrich, 5), dstWritable);
```

**Why:** Controls outbound pressure on DB/APIs.

------

### 4) `.pipe()` vs `pipeline()` error propagation

```js
// ❌ Errors can be lost:
rs.pipe(t1).pipe(t2).pipe(ws);
rs.on('error', onErr); t1.on('error', onErr); t2.on('error', onErr); ws.on('error', onErr); // tedious

// ✅ One callback/place:
pipeline(rs, t1, t2, ws, (err) => { if (err) log(err); });
```

**Interview line:** “I prefer `pipeline()` because it closes/tears down everything and centralizes errors.”

------

### 5) Throttle/byte-rate limit to protect downstream

```js
import { Transform } from 'node:stream';

function throttle(bytesPerSec) {
  let sent = 0, windowStart = Date.now();
  return new Transform({
    transform(chunk, enc, cb) {
      const now = Date.now();
      if (now - windowStart >= 1000) { windowStart = now; sent = 0; }
      sent += chunk.length;
      const over = sent - bytesPerSec;
      if (over > 0) setTimeout(() => cb(null, chunk), over * (1000 / bytesPerSec));
      else cb(null, chunk);
    }
  });
}
```

**Why:** Prevents overwhelming slow clients/services.

------

### 6) HTTP upload → sanitize → disk (with backpressure)

```js
import { pipeline as pipeP } from 'node:stream/promises';
import fs from 'node:fs';

async function saveUpload(req, outPath) {
  const sanitize = new Transform({
    transform(c, _e, cb) {
      // drop NULs, basic guard; real code would validate content-type/size elsewhere
      cb(null, Buffer.from(String(c).replaceAll('\u0000', '')));
    }
  });
  await pipeP(req, sanitize, fs.createWriteStream(outPath, { flags: 'wx', mode: 0o600 }));
}
```

------

## Tuning knobs that matter

- **`highWaterMark`**: lower to cap memory (e.g., 32–128 KiB for byte streams), raise for throughput on fast disks/networks.
- **`objectMode`**: needed for JS objects; each pushed item counts as “1” toward `highWaterMark`.
- **Gzip `level`**: higher = smaller output but more CPU. Choose based on your CPU budget.
- **`end: false` in `.pipe()`**: when you need to keep a destination open for multiple sources (remember to `dest.end()` yourself).

------

## Gotchas & checks

- Don’t mix **string**/Buffer chunks accidentally; be explicit with encodings.
- Always **validate sizes** (headers, `Content-Length`, count bytes in transforms) to avoid unbounded buffering.
- **Never** ignore `'error'` on custom streams; use `pipeline()` to centralize.
- For multi-GB flows, prefer **zero-copy** where possible (e.g., `fs.copyFile`, sendfile via reverse proxy) and only stream when you must transform/inspect.

------

## ✅ Interview Tips

- Define **backpressure** crisply and show how `write()`/`'drain'` implement it.
- Say **why `pipeline()` beats chained `.pipe()`** (error/close propagation).
- Show a **concurrency-limited Transform** for real ETL/API enrichment.
- Mention tuning **`highWaterMark`** and gzip `level` for perf/memory trade-offs.

------

Next: **transform-streams.md** (build custom transforms correctly, object mode, `_flush`, and real ETL examples), or want to skip to a different section?