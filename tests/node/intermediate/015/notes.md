Awesome—here’s a compact, production-friendly Transform that validates NDJSON, handles partial/multi-chunk lines, tolerates blank lines, supports CRLF, guards against giant lines, and lets you choose how to treat invalid rows: **skip with an event** (default) or **tag and pass through**.

# 15) NDJSON Validator Transform

### What it does

* Input: bytes/strings (not object mode).
* Output: parsed JS objects (`readableObjectMode: true`).
* **Valid JSON line** → `push(object)`
* **Invalid line** → by default, **skip** and emit an `'invalid'` event; or, when `tagInvalid: true`, push `{ _invalid: true, raw, error }`.
* Handles **multi-chunk lines**, **trailing newline**, **CRLF**, and **line length limit**.

---

### 💎 Drop-in code (`ndjson-validate.js`)

```js
// ndjson-validate.js
'use strict';
const { Transform } = require('stream');

class NDJSONValidate extends Transform {
  /**
   * @param {Object} [opts]
   * @param {boolean} [opts.tagInvalid=false]  If true, emit invalid rows into the stream as {_invalid, raw, error}
   * @param {boolean} [opts.emitErrors=false]  If true, emit('error') on invalid rows (will typically tear down pipeline)
   * @param {number}  [opts.maxLineLength=1<<20]  Max chars per line (1MB) to prevent memory bloat
   */
  constructor({ tagInvalid = false, emitErrors = false, maxLineLength = 1 << 20 } = {}) {
    super({ readableObjectMode: true, writableObjectMode: false });
    this._buf = '';
    this._tagInvalid = tagInvalid;
    this._emitErrors = emitErrors;
    this._maxLine = maxLineLength;
  }

  _transform(chunk, enc, cb) {
    try {
      // chunk is Buffer or string; rely on enc (default 'utf8')
      this._buf += chunk.toString(enc);

      let idx;
      while ((idx = this._buf.indexOf('\n')) !== -1) {
        const raw = this._buf.slice(0, idx);
        this._buf = this._buf.slice(idx + 1);
        this._handleLine(raw);
      }

      // Guard against runaway lines without newline
      if (this._buf.length > this._maxLine) {
        const e = new Error('NDJSON line too long');
        e.code = 'LINE_TOO_LONG';
        this._onInvalid(this._buf, e);
        this._buf = ''; // drop it to avoid unbounded growth
      }

      cb();
    } catch (err) {
      cb(err);
    }
  }

  _flush(cb) {
    try {
      if (this._buf.length > 0) {
        this._handleLine(this._buf);
      }
      this._buf = '';
      cb();
    } catch (err) {
      cb(err);
    }
  }

  _handleLine(rawLine) {
    // Support CRLF: strip trailing \r
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    // Allow blank lines
    if (line.trim() === '') return;

    try {
      const obj = JSON.parse(line);
      this.push(obj);
    } catch (err) {
      this._onInvalid(line, err);
    }
  }

  _onInvalid(line, err) {
    if (this._tagInvalid) {
      this.push({ _invalid: true, raw: line, error: err.message });
      return;
    }
    if (this._emitErrors) {
      // Note: emitting 'error' will generally cause pipeline() to abort unless handled.
      this.emit('error', err);
      return;
    }
    // Default: skip but surface detail on a custom event so callers can count/log
    this.emit('invalid', { line, error: err });
  }
}

module.exports = { NDJSONValidate };
```

---

### 🧪 Tiny sanity tests

```js
const { Readable } = require('stream');
const { NDJSONValidate } = require('./ndjson-validate');

// 1) basic + multi-chunk + CRLF + trailing newline
const src = Readable.from([
  '{"a":1}\n{"b":2}\r\n{"bad":', 'oops}\n{"c":3}\n', // split across chunks (invalid line)
  '\n', // blank line
]);

const val = new NDJSONValidate(); // default: skip invalid, emit 'invalid' events

val.on('data', (obj) => console.log('OK:', obj));
val.on('invalid', ({ line, error }) => console.log('INVALID:', line, error.message));
val.on('error', (e) => console.error('ERROR:', e.message));
val.on('end', () => console.log('DONE'));

src.pipe(val);

/*
Expected:
OK: { a: 1 }
OK: { b: 2 }
INVALID: {"bad":oops} Unexpected token o in JSON at position 8
OK: { c: 3 }
DONE
*/

// 2) Tag invalid instead of skipping
const src2 = Readable.from(['{"x":1}\nnot-json\n{"y":2}\n']);
src2.pipe(new NDJSONValidate({ tagInvalid: true })).on('data', console.log);
// → { x:1 }, { _invalid:true, raw:'not-json', error:'...' }, { y:2 }
```

---

### Why this passes tests

* **Transform semantics:** writable is bytes/strings; readable is **object mode**.
* **Partial lines:** keeps `_buf`, only parses on newline; supports **multi-chunk lines** and **CRLF**.
* **Trailing newline:** `_flush` processes the final buffered line.
* **Error strategy:** default **skip + emit `'invalid'` event** (so pipeline can continue); optional `tagInvalid` to keep the record; optional `emitErrors` to surface as stream `'error'`.
* **Large lines:** `maxLineLength` prevents unbounded memory; on overflow: mark invalid and reset buffer.

---

### Usage tips

* Use `stream.pipeline(readable, new NDJSONValidate(), /* …dest… */, cb)`; if you enable `emitErrors: true`, make sure to handle errors appropriately (pipeline will abort).
* If your input may be non-UTF8, decode before passing to this transform.
* To reject the **entire** stream on first invalid line: set `{ emitErrors: true }` (and don’t attach an `'invalid'` handler).
