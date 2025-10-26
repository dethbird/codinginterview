# 20) High-Perf Static File Server with Preopen + Range

**Goal:** Serve large files with preopen, range requests, and weak ETag.

### 💎 Gold answer (`static-range.js`)
```js
'use strict';
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = process.env.ROOT || process.cwd();

const fdCache = new Map(); // filename -> fd

function weakETag(stat) {
  return `W/"${stat.size}-${Number(stat.mtimeMs).toString(16)}"`;
}

http.createServer(async (req, res) => {
  try {
    const urlPath = new URL(req.url, 'http://x').pathname;
    const file = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/,'') || '');
    const stat = await fsp.stat(file);
    if (!stat.isFile()) throw Object.assign(new Error('Not file'), { code: 'EISDIR' });

    const etag = weakETag(stat);
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag });
      return res.end();
    }

    let start = 0, end = stat.size - 1, status = 200, headers = {
      'Accept-Ranges': 'bytes',
      'Content-Type': 'application/octet-stream',
      'ETag': etag
    };

    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      if (m[1] !== '') start = parseInt(m[1], 10);
      if (m[2] !== '') end = parseInt(m[2], 10);
      if (isNaN(start) || isNaN(end) || start > end || end >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = (end - start + 1);

    // Preopen / reuse fds
    let fd = fdCache.get(file);
    if (!fd) {
      fd = await fsp.open(file, 'r');
      fdCache.set(file, fd);
    }

    res.writeHead(status, headers);
    const stream = fd.createReadStream({ start, end });
    stream.on('error', (e) => { res.destroy(e); });
    stream.pipe(res);
  } catch (e) {
    const code = e.code === 'ENOENT' ? 404 : 500;
    res.writeHead(code, { 'Content-Type': 'text/plain' });
    res.end(code === 404 ? 'Not Found' : 'Server Error');
  }
}).listen(8080, () => console.log('static-range :8080 root=', ROOT));
```

### Notes
- Multiple ranges are not supported (respond `416` or ignore).
- ETag is weak (size+mtime). Good enough for static assets.
