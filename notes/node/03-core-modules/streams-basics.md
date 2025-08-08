**streams-basics.md**

# Streams (Readable, Writable, Duplex, Transform) & Backpressure

## 📌 What & why

**Streams** let you process data **incrementally** instead of loading it all into memory (files, HTTP bodies, DB dumps, logs). They give you:

- Lower memory usage
- Natural **backpressure** (slow consumers throttle fast producers)
- Composability via **`pipeline`**

------

## Stream types (quick map)

- **Readable**: produces data → `fs.createReadStream`, HTTP request body, etc.
- **Writable**: consumes data → `fs.createWriteStream`, HTTP response, TCP socket.
- **Duplex**: both readable & writable → TCP socket.
- **Transform**: duplex that **modifies** data → gzip, JSON→CSV converter, throttler.

------

## Key concepts you’ll be asked about

- **Backpressure**: `writable.write(chunk)` returns **`false`** when its internal buffer is full. Producer should **pause** until `'drain'`.
- **Flowing vs paused mode (Readable)**:
  - Flowing: emits `'data'` automatically (after `readable.on('data')` or `.pipe()`).
  - Paused: you call `readable.read()` manually; use `.pause()`/`.resume()`.
- **`highWaterMark`**: buffer watermark (bytes or objects). Lower it to reduce memory spikes; raise for throughput.
- **`objectMode`**: stream handles **objects** instead of bytes. Great for line parsers, JSON records, etc.
- **Use `pipeline`** instead of raw `.pipe()` to propagate **errors & close** correctly.

------

## Essential APIs (with args)

```js
import fs from 'node:fs';
import { Transform, pipeline } from 'node:stream';
import { pipeline as pipelineP } from 'node:stream/promises'; // Promise version
```

### Readable

- `readable.setEncoding(enc)` → make it emit strings (e.g., `'utf8'`) instead of Buffers.
- Events: `'data'`, `'end'`, `'error'`, `'readable'`.
- Static helper: `Readable.from(iterable|asyncIterable[, options])`.

### Writable

- `writable.write(chunk[, encoding][, cb]) -> boolean` (**false** = backpressure).
- `writable.end([chunk][, encoding][, cb])`.
- Events: `'drain'`, `'finish'`, `'error'`.

### Transform

```js
class LineSplit extends Transform {
  constructor() { super({ readableObjectMode: true }); this._buf = ''; }
  _transform(chunk, enc, cb) {
    this._buf += chunk.toString('utf8');
    const parts = this._buf.split(/\r?\n/);
    this._buf = parts.pop()!;
    for (const line of parts) this.push(line);
    cb();
  }
  _flush(cb) { if (this._buf) this.push(this._buf); cb(); }
}
```

Options highlights:

- `{ objectMode, readableObjectMode, writableObjectMode, highWaterMark }`.

### `pipeline` (recommended)

```js
pipeline(src, t1, t2, dest, (err) => { if (err) console.error(err); });
await pipelineP(src, t1, t2, dest); // Promise-based
```

- Properly forwards **errors and closure**.
- In Node 16+, supports `{ signal }` to abort.

------

## Real-world patterns & snippets

### 1) **Backpressure-aware write** (no memory blowups)

```js
function writeMany(writable, chunks) {
  return new Promise((resolve, reject) => {
    let i = 0;
    function write() {
      while (i < chunks.length) {
        const ok = writable.write(chunks[i++]);
        if (!ok) return writable.once('drain', write); // wait for buffer to flush
      }
      writable.end();
    }
    writable.on('error', reject).on('finish', resolve);
    write();
  });
}
```

**Why:** In production, not checking `write()`’s return value is a classic memory leak.

------

### 2) **JSONL → filter → gzip → file** (ETL)

```js
import fs from 'node:fs';
import zlib from 'node:zlib';
import { Transform } from 'node:stream';
import { pipeline as pipeP } from 'node:stream/promises';

const lineSplit = new (class extends Transform {
  constructor() { super({ readableObjectMode: true }); this.buf = ''; }
  _transform(chunk, enc, cb) {
    this.buf += chunk; const lines = this.buf.split('\n'); this.buf = lines.pop()!;
    for (const l of lines) if (l.trim()) this.push(JSON.parse(l));
    cb();
  }
  _flush(cb) { if (this.buf.trim()) this.push(JSON.parse(this.buf)); cb(); }
})();

const filterActive = new Transform({
  readableObjectMode: true, writableObjectMode: true,
  transform(obj, _, cb) { if (obj.active) this.push(obj); cb(); }
});

const toJsonl = new Transform({
  writableObjectMode: true,
  transform(obj, _, cb) { this.push(JSON.stringify(obj) + '\n'); cb(); }
});

await pipeP(
  fs.createReadStream('in.jsonl', { encoding: 'utf8' }),
  lineSplit,
  filterActive,
  toJsonl,
  zlib.createGzip({ level: 6 }),
  fs.createWriteStream('out.jsonl.gz')
);
```

**Why:** Real ETL jobs commonly use JSON Lines; stream it to keep memory small.

------

### 3) **HTTP proxy: stream upstream → client** with abort

```js
import http from 'node:http';
import { pipeline as pipeP } from 'node:stream/promises';
import { Readable } from 'node:stream';

const server = http.createServer(async (req, res) => {
  const upstream = http.request(
    { hostname: 'backend', port: 8080, path: req.url, method: req.method, headers: req.headers }
  );
  req.pipe(upstream); // request body to upstream

  req.on('close', () => upstream.destroy()); // abort upstream if client drops

  upstream.on('response', async (upRes) => {
    res.writeHead(upRes.statusCode || 502, upRes.headers);
    try {
      await pipeP(upRes, res); // stream response back
    } catch (e) {
      if (!res.headersSent) res.statusCode = 502;
      res.end();
    }
  });

  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
});
server.listen(3000);
```

**Why:** Forwarding large downloads/uploads without buffering.

------

### 4) **Throttling Transform** (protect downstream systems)

```js
class Throttle extends Transform {
  constructor(bytesPerSec) {
    super(); this.interval = 1000; this.max = bytesPerSec; this.sent = 0; this.t0 = Date.now();
  }
  _transform(chunk, enc, cb) {
    const now = Date.now();
    if (now - this.t0 >= this.interval) { this.t0 = now; this.sent = 0; }
    this.sent += chunk.length;
    const over = this.sent - this.max;
    if (over > 0) setTimeout(() => { this.push(chunk); cb(); }, over * (this.interval / this.max));
    else { this.push(chunk); cb(); }
  }
}
```

**Why:** Rate-limit your own exports or third-party ingestion.

------

### 5) **ObjectMode pipeline** (DB rows → CSV)

```js
import { Transform } from 'node:stream';
import fs from 'node:fs';
import { pipeline as pipeP } from 'node:stream/promises';

async function* fetchRows(pool) { // Async generator as Readable
  const res = await pool.query('select id,name from users'); // example; consider cursor for huge sets
  for (const row of res.rows) yield row; // emits JS objects
}

const toCsv = new Transform({
  writableObjectMode: true,
  transform(row, _, cb) {
    this.push(`${row.id},${JSON.stringify(row.name)}\n`);
    cb();
  }
});

await pipeP(Readable.from(fetchRows(pool)), toCsv, fs.createWriteStream('users.csv'));
```

**Why:** Streaming DB exports without building a giant array.

------

### 6) **Graceful error handling with `pipeline`**

```js
pipeline(
  fs.createReadStream('in.bin'),
  new Transform({ transform(c, e, cb) { /* might throw */ cb(null, c); } }),
  fs.createWriteStream('out.bin'),
  (err) => {
    if (err) console.error('Pipeline failed:', err); // All errors land here
    else console.log('Pipeline succeeded');
  }
);
```

**Why:** `.pipe()` alone can swallow errors and leak file descriptors.

------

### 7) **Custom Readable from a queue** (producer/consumer)

```js
import { Readable } from 'node:stream';

function queueReadable() {
  const q = [];
  let push;
  const r = new Readable({
    objectMode: true,
    read() {
      if (q.length) this.push(q.shift());
      else push = (item) => this.push(item);
    }
  });
  return { r, push: (item) => (push ? push(item) : q.push(item)) };
}

// Usage:
const { r, push } = queueReadable();
// elsewhere:
push({ id: 1 }); push({ id: 2 });
r.on('data', row => /* consume */);
```

**Why:** Bridge event-driven producers into backpressure-aware consumers.

------

## Tuning tips (prod)

- Pick sensible `highWaterMark` values (e.g., `64 * 1024` for file byte streams).
- Use **object mode** only when you need JS objects (each item counts as “1”, not bytes).
- Prefer **`pipeline`** (or `stream/promises` version) to avoid resource leaks.
- For **line processing**, don’t call `.setEncoding('utf8')` if you need exact byte counts; decode yourself to avoid splitting multi-byte sequences across chunks.

------

## ✅ Interview Tips

- Explain **what backpressure is** and how `write()` + `'drain'` implement it.
- Show preference for **`pipeline`** over chained `.pipe()` and why.
- Know **objectMode** & **highWaterMark** and when to change them.
- Provide a concrete example (e.g., *JSONL → filter → gzip → S3/file*).

------

Next up: **http-https.md** (raw HTTP server, headers & streams, keep-alive, timeouts, and robust error handling).