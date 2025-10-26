# 21) Redis-Style RESP Parser (streams)

**Goal:** Transform stream that parses a subset of RESP into JS values.

### 💎 Gold answer (`resp-parser.js`)
```js
'use strict';
const { Transform } = require('stream');

class RESPParser extends Transform {
  constructor() {
    super({ readableObjectMode: true });
    this.state = 'type';
    this.buf = Buffer.alloc(0);
    this.bulkLen = -1;
    this.arrayStack = []; // for nested arrays
  }

  _pushVal(val, cb) {
    if (this.arrayStack.length) {
      const top = this.arrayStack[this.arrayStack.length - 1];
      top.items.push(val);
      if (top.items.length === top.len) {
        this.arrayStack.pop();
        return this._pushVal(top.items, cb);
      }
      return cb();
    } else {
      this.push(val);
      return cb();
    }
  }

  _parseLine() {
    const idx = this.buf.indexOf('\r\n');
    if (idx === -1) return null;
    const line = this.buf.slice(0, idx).toString('utf8');
    this.buf = this.buf.slice(idx + 2);
    return line;
  }

  _transform(chunk, enc, cb) {
    this.buf = Buffer.concat([this.buf, chunk]);
    try {
      while (true) {
        if (this.state === 'type') {
          if (this.buf.length < 1) break;
          this.type = String.fromCharCode(this.buf[0]);
          this.buf = this.buf.slice(1);
          this.state = 'payload';
        }
        if (this.state === 'payload') {
          if (this.type === '+') {
            const line = this._parseLine(); if (line === null) break;
            this.state = 'type'; this._pushVal(line, () => {});
          } else if (this.type === ':') {
            const line = this._parseLine(); if (line === null) break;
            this.state = 'type'; this._pushVal(parseInt(line, 10), () => {});
          } else if (this.type === '$') {
            const line = this._parseLine(); if (line === null) break;
            this.bulkLen = parseInt(line, 10);
            if (this.bulkLen === -1) { this.state = 'type'; this._pushVal(null, () => {}); }
            else this.state = 'bulk';
          } else if (this.type === '*') {
            const line = this._parseLine(); if (line === null) break;
            const len = parseInt(line, 10);
            if (len === -1) { this.state = 'type'; this._pushVal(null, () => {}); }
            else { this.arrayStack.push({ len, items: [] }); this.state = 'type'; }
          } else {
            throw new Error('Unknown RESP type');
          }
        }
        if (this.state === 'bulk') {
          if (this.buf.length < this.bulkLen + 2) break;
          const data = this.buf.slice(0, this.bulkLen).toString('utf8');
          this.buf = this.buf.slice(this.bulkLen + 2); // skip CRLF
          this.state = 'type';
          this._pushVal(data, () => {});
        }
      }
      cb();
    } catch (e) { cb(e); }
  }
}

module.exports = { RESPParser };
```

### Notes
- Supports `+simple`, `:int`, `$bulk`, `*array` (nested).
- Null bulk/array `-1` → `null`.
