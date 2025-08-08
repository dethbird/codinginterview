**buffer-and-typedarrays.md**

# Buffer & TypedArrays (binary data in Node)

## 📌 What & why

- **`Buffer`** is Node’s primary binary container. It’s a subclass of `Uint8Array`, backed by raw memory, optimized for I/O (files, sockets, crypto).
- **TypedArrays / ArrayBuffer / DataView** are the web-standard primitives for binary data. Useful for cross-platform libs or when you need non-byte views (e.g., `Uint32Array`) or structured reads with endianness.

Use `Buffer` for most Node work (file/network/crypto). Reach for TypedArrays/DataView when you need numeric views, strict control over endianness, or to stay web-compatible.

------

## Core creation & safety

```js
// ✅ Zero-filled (safe)
const buf = Buffer.alloc(1024);

// ⚠️ Uninitialized (fast, must fill before reading)
const fast = Buffer.allocUnsafe(1024);
fast.fill(0); // if you must read from it later

// From strings / arrays / other buffers
Buffer.from('hello', 'utf8');        // string → bytes
Buffer.from([0xde, 0xad, 0xbe, 0xef]);
Buffer.from(existingBuffer);         // copy
```

**Encodings** (second arg when from/to string): `'utf8'` (default), `'ascii'`, `'latin1'`, `'base64'`, `'hex'`.
 **Security tip:** Prefer `alloc` over `allocUnsafe` unless you overwrite all bytes.

------

## Size, indexing, copy, slice

```js
Buffer.byteLength('😀', 'utf8'); // 4 (bytes, not characters)

const a = Buffer.from('abcd');
const b = Buffer.alloc(2);
a.copy(b, /*targetStart*/0, /*sourceStart*/1, /*sourceEnd*/3); // b = 'bc'

// Views share memory (no copy):
const view = a.slice(1, 3);      // 'bc' shares memory with `a`
const alsoView = a.subarray(1,3) // same idea
view[0] = 0x65;                  // mutates `a` too!
// Make a copy:
const copy = Buffer.from(a);     // independent bytes
```

**Compare/search**

```js
Buffer.compare(a, copy);     // -1/0/1 lexicographic
a.equals(copy);              // boolean
a.includes(Buffer.from('bc')); // true
a.indexOf(0x62);             // byte index (b)
```

------

## Strings ↔ bytes

```js
const buf = Buffer.from('hello', 'utf8');
buf.toString('utf8');       // 'hello'
buf.toString('base64');     // 'aGVsbG8='
Buffer.from('aGVsbG8=', 'base64').toString('utf8'); // 'hello'
```

**Web-compat alternative**:

```js
const enc = new TextEncoder();                 // UTF-8 only
const dec = new TextDecoder('utf-8', { fatal: false });
const u8  = enc.encode('hello');               // Uint8Array
dec.decode(u8);                                // 'hello'
```

------

## TypedArrays & DataView (when you need numbers/endian)

```js
const ab = new ArrayBuffer(8);
const u32 = new Uint32Array(ab); // 2 x 32-bit ints
u32[0] = 0x11223344;

const dv = new DataView(ab);
dv.setUint16(4, 0xdead, /*littleEndian=*/ true);
const x = dv.getUint16(4, true);
```

**When to use:** reading/writing structured binary formats (headers, network frames) with explicit endianness.

------

## Real-world patterns & snippets

### 1) Parse a simple binary header (endianness!)

```js
import { promises as fsp } from 'node:fs';

const fd = await fsp.open('file.bin', 'r');
try {
  const head = Buffer.alloc(12);
  await fd.read(head, 0, 12, 0);

  const dv = new DataView(head.buffer, head.byteOffset, head.byteLength);
  const magic = head.toString('ascii', 0, 4);       // 'FILE'
  const version = dv.getUint16(4, false);           // big-endian
  const flags   = dv.getUint16(6, false);
  const length  = dv.getUint32(8, false);

  if (magic !== 'FILE') throw new Error('Bad file');
  console.log({ version, flags, length });
} finally {
  await fd.close();
}
```

### 2) Length-prefixed TCP frame (common microservice protocol)

```js
import net from 'node:net';

const sock = net.connect(9000);

function sendJSON(obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8');
  const frame = Buffer.alloc(4 + payload.length);
  frame.writeUInt32BE(payload.length, 0); // 4-byte length, big-endian
  payload.copy(frame, 4);
  sock.write(frame);
}

let acc = Buffer.alloc(0);
sock.on('data', (chunk) => {
  acc = Buffer.concat([acc, chunk]);
  while (acc.length >= 4) {
    const len = acc.readUInt32BE(0);
    if (acc.length < 4 + len) break;
    const body = acc.slice(4, 4 + len);   // view (ok: we convert immediately)
    const msg  = JSON.parse(body.toString('utf8'));
    console.log('message', msg);
    acc = acc.slice(4 + len);             // drop consumed bytes
  }
});
```

### 3) Efficient concatenation (avoid N times `Buffer.concat`)

```js
// BAD: concat in a loop -> O(n^2) copying
// GOOD: collect then concat once
const chunks = [];
let total = 0;

rs.on('data', (c) => { chunks.push(c); total += c.length; });
rs.on('end', () => {
  const all = Buffer.concat(chunks, total); // one allocation/copy
  // ...
});
```

### 4) Base64 upload → file (typical API)

```js
async function saveBase64Image(b64, outPath) {
  // b64 like "data:image/png;base64,AAAA..."
  const comma = b64.indexOf(',');
  const raw = comma >= 0 ? b64.slice(comma + 1) : b64;
  const bytes = Buffer.from(raw, 'base64');
  await fsp.writeFile(outPath, bytes, { mode: 0o644 });
}
```

### 5) Crypto: constant-time compare (avoid timing leaks)

```js
import crypto from 'node:crypto';

function safeEqual(a, b) {
  const A = Buffer.isBuffer(a) ? a : Buffer.from(a);
  const B = Buffer.isBuffer(b) ? b : Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}
```

### 6) Gzip/unzip buffers (zlib)

```js
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';

const gz = promisify(gzip);
const ungz = promisify(gunzip);

const zipped = await gz(Buffer.from(JSON.stringify(obj)));
const raw    = JSON.parse((await ungz(zipped)).toString('utf8'));
```

### 7) CSV exporter without buffering entire file (streaming)

```js
import fs from 'node:fs';

function writeCsv(rows, outPath) {
  const ws = fs.createWriteStream(outPath, { flags: 'w' });
  for (const r of rows) {
    const line = Buffer.from(r.join(',') + '\n', 'utf8');
    if (!ws.write(line)) {
      // backpressure—wait for 'drain'
      return new Promise((res, rej) => {
        ws.once('drain', () => res(writeCsv(rows.slice(1), outPath)));
        ws.once('error', rej);
      });
    }
  }
  return new Promise((res, rej) => ws.end(res).on('error', rej));
}
```

------

## Reading/writing numeric values on Buffers

```js
const b = Buffer.alloc(8);
b.writeUInt32BE(0xfeedface, 0);
b.writeUInt16LE(0x1337, 4);
const x = b.readUInt32BE(0);
const y = b.readUInt16LE(4);
```

**Methods:** `read/writeUInt8/16LE/16BE/32LE/32BE`, `read/writeInt*`, `read/writeFloatLE/BE`, `read/writeDoubleLE/BE`.

------

## Common pitfalls (and fixes)

- **String length ≠ byte length**: emojis/some unicode are multi-byte. Use `Buffer.byteLength(str, 'utf8')` for sizing.
- **Accidental shared memory**: `slice`/`subarray` **share** memory. Use `Buffer.from(view)` to copy before long-term storage/mutation.
- **Allocating in hot loops**: reuse buffers or pool where possible.
- **Mixing encodings**: be explicit (`'utf8'`, `'base64'`, `'hex'`) and keep them consistent across boundaries.
- **Unsafe buffers**: don’t read from `allocUnsafe` before you overwrite; may contain old memory.

------

## ✅ Interview Tips

- Know `Buffer` vs `Uint8Array` vs `ArrayBuffer` and when to use each.
- Demonstrate length-prefixed framing and endian-aware reads/writes.
- Mention base64/hex conversions and `timingSafeEqual` for secrets.
- Call out `slice` sharing memory and `Buffer.concat` performance patterns.

------

Next: **streams-basics.md** (object vs byte streams, readable/writable/duplex/transform, backpressure, pipeline, and practical ETL/transcoding examples).