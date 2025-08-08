**csv-jsonl-examples.md**

# CSV & JSONL Recipes (streaming-friendly)

## 📌 What & why

- **CSV**: table-ish text with commas, optional quotes — great for spreadsheets & exports.
- **JSONL** (JSON Lines): one JSON object **per line** — great for streaming ETL, logs, and app-to-app data exchange.
- Goal: **process huge files without loading them into memory**, validate rows, transform/select columns, and write outputs safely.

> For robust CSV parsing (quotes, escapes, BOMs, weird delimiters), use a proven library. For tiny/controlled CSV, minimalist code can work.

------

## Tooling options (pick based on the task)

- **Built-ins only**: `fs.createReadStream`, `readline`, your own transforms. Works for JSONL and *simple* CSV.
- **Libraries (recommended for CSV)**:
  - [`csv-parse`](https://www.npmjs.com/package/csv-parse) / [`csv-stringify`](https://www.npmjs.com/package/csv-stringify) (`npm i csv-parse csv-stringify`)
  - For massive JSON arrays (not JSONL), consider `stream-json` (`npm i stream-json`)

------

## 1) CSV → JSONL (robust, with `csv-parse`)

**Purpose:** read an arbitrary CSV with headers; output newline-delimited JSON objects; filter/transform on the fly.

```js
import fs from 'node:fs';
import { pipeline as pipeP } from 'node:stream/promises';
import { parse } from 'csv-parse';

const parser = parse({
  columns: true,            // use header row → objects {col: value}
  skip_empty_lines: true,
  bom: true,                // handle UTF-8 BOM if present
  trim: true,               // trim whitespace around fields
  // delimiter: ',',        // auto-detects common delimiters; set explicitly if needed
  // from_line: 2,          // if no header & you want to skip a header-like row
});

const toJsonl = new (class extends fs.WriteStream {
  constructor() { super('out.jsonl', { flags: 'w' }); }
})();

const transform = new (await import('node:stream')).Transform({
  objectMode: true,
  transform(record, _, cb) {
    // real-world transforms/filters:
    if (record.status !== 'active') return cb(); // drop inactives
    // coerce types (CSV fields are strings)
    record.age = Number(record.age ?? 0);
    this.push(JSON.stringify(record) + '\n');
    cb();
  }
});

await pipeP(
  fs.createReadStream('in.csv'),
  parser,
  transform,
  toJsonl
);
```

**Useful `csv-parse` options (interview-lean):**

- `columns: true | string[]` → header mapping
- `skip_empty_lines: true`
- `bom: true` (Byte Order Mark)
- `relax_quotes: true` (handle funky quoting)
- `delimiter: ',' | '\t' | ';' | ...`
- `on_record(record)` (advanced hook to validate/transform per row)

------

## 2) JSONL → CSV (select columns, quote safely)

**Purpose:** take JSONL, keep a few fields, and write proper CSV with quoting.

Reusing our transform patterns from earlier:

```js
import fs from 'node:fs';
import { pipeline as pipeP } from 'node:stream/promises';
import { Transform } from 'node:stream';

// --- helpers from earlier notes ---
class LineSplit extends Transform {
  constructor() { super({ readableObjectMode: true }); this._buf = ''; }
  _transform(chunk, enc, cb) {
    this._buf += chunk.toString('utf8');
    const lines = this._buf.split(/\r?\n/);
    this._buf = lines.pop() ?? '';
    for (const line of lines) if (line.trim()) this.push(line);
    cb();
  }
  _flush(cb) { if (this._buf.trim()) this.push(this._buf); cb(); }
}

const parseJsonl = new Transform({
  readableObjectMode: true, writableObjectMode: true,
  transform(line, _, cb) {
    try { this.push(JSON.parse(line)); cb(); }
    catch (e) { cb(new Error('bad json line')); }
  }
});

function toCsv(fields) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  let wroteHeader = false;
  return new Transform({
    writableObjectMode: true,
    transform(obj, _, cb) {
      if (!wroteHeader) { this.push(fields.join(',') + '\n'); wroteHeader = true; }
      this.push(fields.map(f => esc(obj[f])).join(',') + '\n');
      cb();
    }
  });
}

// --- pipeline ---
await pipeP(
  fs.createReadStream('in.jsonl'),
  new LineSplit(),
  parseJsonl,
  toCsv(['id', 'name', 'email']),
  fs.createWriteStream('out.csv', { flags: 'w' })
);
```

------

## 3) CSV → Objects with validation (log bad rows)

**Purpose:** import a CSV, validate/coerce fields, write good rows to JSONL, log rejects.

```js
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { pipeline as pipeP } from 'node:stream/promises';
import { Transform } from 'node:stream';

const parser = parse({ columns: true, skip_empty_lines: true, trim: true });

const validate = new Transform({
  writableObjectMode: true, readableObjectMode: true,
  transform(row, _, cb) {
    const errors = [];
    if (!row.email?.includes('@')) errors.push('email');
    const age = Number(row.age);
    if (!Number.isFinite(age) || age < 0) errors.push('age');

    if (errors.length) {
      fs.appendFileSync('rejects.log', JSON.stringify({ row, errors }) + '\n');
      return cb(); // drop
    }
    row.age = age;
    this.push(row);
    cb();
  }
});

const toJsonl = new Transform({
  writableObjectMode: true,
  transform(obj, _, cb) { this.push(JSON.stringify(obj) + '\n'); cb(); }
});

await pipeP(
  fs.createReadStream('users.csv'),
  parser,
  validate,
  toJsonl,
  fs.createWriteStream('users.jsonl')
);
```

------

## 4) Combine many CSVs → one JSONL (dedupe by `id`)

**Purpose:** stitch multiple monthly exports together, avoid duplicates.

```js
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { pipeline as pipeP } from 'node:stream/promises';

const seen = new Set();
const out = fs.createWriteStream('all.jsonl');

for (const file of ['jan.csv', 'feb.csv', 'mar.csv']) {
  const parser = parse({ columns: true, skip_empty_lines: true, trim: true });
  await pipeP(
    fs.createReadStream(file),
    parser,
    new (await import('node:stream')).Transform({
      writableObjectMode: true,
      transform(row, _, cb) {
        const id = row.id?.trim();
        if (!id || seen.has(id)) return cb();
        seen.add(id);
        this.push(JSON.stringify(row) + '\n'); cb();
      }
    }),
    out,
  );
}
out.end();
```

> If `seen` could be huge, persist a Bloom filter or a lightweight DB/set instead of holding in memory.

------

## 5) Massive JSON array → JSONL (use `stream-json`)

**Purpose:** receive an API dump like `[ {...}, {...}, ... ]` that doesn’t fit in memory.

```js
// npm i stream-json
import fs from 'node:fs';
import { pipeline as pipeP } from 'node:stream/promises';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

await pipeP(
  fs.createReadStream('dump.json'),
  parser(),       // parse tokens
  streamArray(),  // iterate array elements
  new (await import('node:stream')).Transform({
    objectMode: true,
    transform({ value }, _, cb) { this.push(JSON.stringify(value) + '\n'); cb(); }
  }),
  fs.createWriteStream('dump.jsonl')
);
```

**Why:** Keeps memory flat regardless of array size.

------

## 6) Gzip on the fly (for both CSV and JSONL)

```js
import fs from 'node:fs';
import zlib from 'node:zlib';
import { pipeline as pipeP } from 'node:stream/promises';

// CSV -> JSONL.gz
await pipeP(
  fs.createReadStream('in.csv'),
  parse({ columns: true, skip_empty_lines: true }),
  new (await import('node:stream')).Transform({
    writableObjectMode: true,
    transform(r, _, cb) { this.push(JSON.stringify(r) + '\n'); cb(); }
  }),
  zlib.createGzip({ level: 6 }),
  fs.createWriteStream('out.jsonl.gz', { flags: 'w' })
);
```

**Parameters worth remembering:**

- `zlib.createGzip({ level })` → `0–9` (higher = smaller, more CPU)
- Stream `highWaterMark` (set on file streams) influences throughput/memory

------

## 7) Row batching → bulk DB insert (JSONL to DB)

```js
import fs from 'node:fs';
import { pipeline as pipeP } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { Pool } from 'pg';

const pool = new Pool({ max: 10 });

function batcher(size = 1000) {
  let buf = [];
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      buf.push(row);
      if (buf.length >= size) {
        const curr = buf; buf = [];
        pool.query(/* build bulk insert */, /* params from curr */)
          .then(() => cb())
          .catch((e) => cb(e));
      } else cb();
    },
    final(cb) {
      if (buf.length === 0) return cb();
      pool.query(/* last bulk insert */)
        .then(() => cb())
        .catch(cb);
    }
  });
}

await pipeP(
  fs.createReadStream('users.jsonl', { encoding: 'utf8' }),
  new LineSplit(),
  parseJsonl,              // from earlier
  batcher(1000)            // avoid per-row insert overhead
);
```

------

## 8) Minimal CSV parsing (only for **simple** CSV)

If your CSV is guaranteed **no quotes/commas-in-fields**, a quick splitter can work:

```js
import fs from 'node:fs';
import readline from 'node:readline';

async function* simpleCsvRows(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }) });
  let headers;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(','); // only safe for simple CSV
    if (!headers) { headers = cols.map(s => s.trim()); continue; }
    const obj = Object.fromEntries(headers.map((h, i) => [h, cols[i]?.trim() ?? '']));
    yield obj;
  }
}
```

> The moment you see quotes, escapes, or embedded commas/newlines — **switch to `csv-parse`**.

------

## Gotchas & best practices

- **Type coercion:** CSV is text; explicitly cast numbers/booleans/dates.
- **Validation:** log rejects with enough context to debug; don’t just drop.
- **Backpressure:** always favor `pipeline()` for multi-stage processing.
- **Atomic outputs:** write to temp + `rename()` to avoid half-written files.
- **Character encoding:** assume UTF-8, but be ready for BOMs; `bom: true` helps.
- **Memory:** avoid storing all rows; process row-by-row, batch for DB writes.

------

## ✅ Interview Tips

- Explain **why JSONL** is ideal for streaming pipelines.
- Show you can use **`csv-parse`** with the right options and **transform on the fly**.
- Mention **gzip in pipeline**, **batching** for DB, and **atomic file writes**.
- Call out when **minimal parsing is insufficient** and why robust libs matter in production.

------

Want to head into **05-networking-and-apis/http-server-from-scratch.md** next, or jump somewhere else?