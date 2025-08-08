**streaming-read-write.md**

# Streaming File Read/Write (patterns & pitfalls)

## 📌 What & why

Use **streams** to handle large files without loading them entirely into memory, to support **range reads**, **progress reporting**, and **backpressure**. Prefer `pipeline` for safe piping with error/close propagation.

------

## Core APIs & parameters

### `fs.createReadStream(path, options?)`

- **`path`**: string | Buffer | URL
- **`options`**:
  - `flags` (default `'r'`)
  - `encoding` (omit for Buffers)
  - `fd` (existing file descriptor)
  - `start`, `end` (byte offsets, inclusive)
  - `highWaterMark` (buffer size; default ~64 KiB)
  - `autoClose` (default `true`)

```js
import fs from 'node:fs';
const rs = fs.createReadStream('big.bin', {
  start: 0,            // first byte to read
  end: 1024 * 1024-1,  // inclusive last byte (read 1 MiB)
  highWaterMark: 64 * 1024
});
```

### `fs.createWriteStream(path, options?)`

- **`options`**:
  - `flags` (`'w'` overwrite, `'wx'` fail if exists, `'a'` append, `'ax'` append-if-new)
  - `mode` (e.g., `0o600`)
  - `start` (byte offset to begin writing)
  - `highWaterMark`

```js
const ws = fs.createWriteStream('out.log', { flags: 'a', mode: 0o644 });
```

### `stream/promises.pipeline(...streams[, options])`

- Safely connects streams; returns a Promise.
- **`options.signal`** → `AbortSignal` to cancel the whole pipeline.

------

## Practical patterns

### 1) Copy a big file (streaming, with checksum)

```js
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';

export async function copyWithSha256(src, dest, { signal } = {}) {
  const rs = fs.createReadStream(src);
  const ws = fs.createWriteStream(dest, { flags: 'wx', mode: 0o644 }); // fail if exists
  const hasher = crypto.createHash('sha256');
  await pipeline(rs, hasher, ws, { signal }); // writes hashed bytes to dest
  // For verification, hash the dest too (or collect digest while streaming)
}
```

> For a straight copy without hashing, `await fs.promises.copyFile(src, dest)` is fastest.

------

### 2) Atomic write (temp + rename)

```js
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * writeFileAtomic: writes JSON atomically (same device).
 * @param {string} file
 * @param {any} data
 * @param {{mode?: number}} [opts]
 */
export async function writeFileAtomic(file, data, opts = {}) {
  const dir = path.dirname(file);
  await fsp.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${randomUUID()}.tmp`);
  await fsp.writeFile(tmp, JSON.stringify(data), { mode: opts.mode ?? 0o600 });
  await fsp.rename(tmp, file); // atomic on same filesystem
}
```

------

### 3) Read JSON Lines (JSONL) safely (line-by-line)

```js
import fs from 'node:fs';
import readline from 'node:readline';

export async function consumeJsonl(file, onRow) {
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    onRow(JSON.parse(line)); // try/catch if untrusted
  }
}
```

------

### 4) Progress reporting while reading

```js
import fs from 'node:fs';
import { stat } from 'node:fs/promises';

export async function readWithProgress(file, onProgress) {
  const { size } = await stat(file);
  let seen = 0;
  await new Promise((res, rej) => {
    const rs = fs.createReadStream(file);
    rs.on('data', (chunk) => { seen += chunk.length; onProgress(seen / size); });
    rs.on('end', res).on('error', rej);
  });
}
```

------

### 5) HTTP range responses (partial content)

```js
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

export async function serveFileRange(req, res, filePath, size) {
  const range = req.headers.range; // e.g., "bytes=0-1023"
  if (!range) {
    res.writeHead(200, { 'content-length': size }).end(); // or stream whole file
    return;
  }

  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m) return res.writeHead(416).end();

  let [ , startStr, endStr ] = m;
  let start = startStr ? Number(startStr) : 0;
  let end = endStr ? Number(endStr) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) return res.writeHead(416).end();

  const rs = fs.createReadStream(filePath, { start, end });
  res.writeHead(206, {
    'content-range': `bytes ${start}-${end}/${size}`,
    'accept-ranges': 'bytes',
    'content-length': end - start + 1,
    'content-type': 'application/octet-stream'
  });
  await pipeline(rs, res);
}
```

------

### 6) Append-only logging (respect backpressure)

```js
import fs from 'node:fs';
const ws = fs.createWriteStream('app.log', { flags: 'a' });

export function logLine(line) {
  if (!ws.write(line + '\n')) {
    ws.once('drain', () => {/* could flush queued logs here */});
  }
}
```

------

### 7) Tail last N bytes (e.g., last 64 KiB)

```js
import fs from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export async function tailBytes(file, n, destStream) {
  const { size } = await stat(file);
  const start = Math.max(0, size - n);
  const rs = fs.createReadStream(file, { start, end: size - 1 });
  await pipeline(rs, destStream);
}
```

------

### 8) Abortable pipeline (shutdown or client disconnect)

```js
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

export async function saveUpload(req, outPath, { signal } = {}) {
  await fs.promises.mkdir(new URL('.', outPath), { recursive: true }).catch(() => {});
  const ws = fs.createWriteStream(outPath, { flags: 'wx', mode: 0o600 });
  await pipeline(req, ws, { signal }); // if signal aborts, both ends are torn down
}
```

------

## Tuning & gotchas

- **`highWaterMark`**: increase for throughput (fewer syscalls), decrease to cap memory.
- **`end` is inclusive** in `createReadStream({ start, end })`.
- Use **`flags: 'wx'`** when you must not overwrite existing files.
- Prefer **`copyFile`** for local copies; use streaming when you need **transformations, throttling, hashing, or remote I/O**.
- Always use **`pipeline`** (or `stream/promises.pipeline`) to avoid leaks and to propagate errors.
- Don’t convert Buffers to strings unless you need to—keeps throughput high and avoids encoding issues.

------

## ✅ Interview Tips

- Explain why **streams** beat `readFile`/`writeFile` for large payloads.
- Show **range support** and **atomic writes**.
- Mention **backpressure** and **`pipeline`** for robustness.
- Call out **security**: safe flags (`'wx'`), size limits, and validation of paths.

------

Next: **piping-and-backpressure.md** (multi-stage pipelines, error propagation, throttling, and memory safety in long chains).