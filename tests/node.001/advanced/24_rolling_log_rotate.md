# 24) Rolling Log Writer with Backpressure + Rotation

**Goal:** Write JSON lines, rotate on size/time, apply buffer with drop-new when slow.

### 💎 Gold answer (`log-rotate.js`)
```js
'use strict';
const fs = require('fs');
const path = require('path');

class RollingLog {
  constructor({ dir='.', prefix='app', maxBytes=10*1024*1024, intervalMs=60_000, bufferMax=1000 } = {}) {
    this.dir = dir; this.prefix = prefix; this.maxBytes = maxBytes; this.intervalMs = intervalMs; this.bufferMax = bufferMax;
    this.buf = [];
    this.curPath = null;
    this.curSize = 0;
    this.stream = null;
    this.timer = setInterval(() => this.rotate('time'), this.intervalMs);
    this.timer.unref?.();
  }

  _openNew() {
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    this.curPath = path.join(this.dir, `${this.prefix}-${ts}.log`);
    this.stream = fs.createWriteStream(this.curPath, { flags: 'a' });
    this.curSize = 0;
    this.stream.on('drain', () => this._flush());
    this.stream.on('error', (e) => { /* best-effort: drop */ });
  }

  rotate(reason='manual') {
    if (this.stream) this.stream.end();
    this._openNew();
  }

  write(obj) {
    const line = JSON.stringify(obj) + '\n';
    this.buf.push(line);
    if (this.buf.length > this.bufferMax) {
      // drop-new policy
      this.buf.pop(); // drop the one we just added
      return false;
    }
    this._flush();
    return true;
  }

  _flush() {
    if (!this.stream) this._openNew();
    while (this.buf.length) {
      const line = this.buf[0];
      if (this.curSize + Buffer.byteLength(line) > this.maxBytes) {
        this.rotate('size');
        continue;
      }
      const ok = this.stream.write(line);
      this.curSize += Buffer.byteLength(line);
      this.buf.shift();
      if (!ok) break; // respect backpressure
    }
  }

  async close() {
    clearInterval(this.timer);
    await new Promise(r => {
      if (!this.stream) return r();
      this.stream.end(r);
    });
  }
}

module.exports = { RollingLog };
```

### Notes
- Rotation based on size or periodic timer.
- On backpressure, buffer fills; when over `bufferMax`, newest messages are dropped.
- Consider fs error handling & process shutdown hooks to flush.
