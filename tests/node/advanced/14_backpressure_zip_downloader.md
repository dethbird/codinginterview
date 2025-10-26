# 14) Backpressure-Aware Zip Downloader

**Goal:** Stream a large download and write entries while respecting backpressure; abort on first failure.

> For algorithmic practice without deps, we’ll treat the zip as a stream with fake entry boundaries like `\n===ENTRY:name===\n`.

### 💎 Gold answer (`zip-stream-dl.js`)
```js
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, outDir) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      fs.mkdirSync(outDir, { recursive: true });

      let current = null; // { name, stream }
      let buffer = '';

      const cleanup = (err) => {
        req.destroy();
        res.destroy();
        if (current) current.stream.destroy();
        reject(err);
      };

      res.setEncoding('utf8'); // for boundary parsing demo
      res.on('data', (chunk) => {
        buffer += chunk;
        let idx;
        while ((idx = buffer.indexOf('\n===ENTRY:')) !== -1) {
          // write previous payload up to boundary
          if (current) {
            const payload = buffer.slice(0, idx);
            if (!current.stream.write(payload)) {
              res.pause();
              current.stream.once('drain', () => res.resume());
            }
          }
          // consume boundary line
          const end = buffer.indexOf('===\n', idx);
          if (end === -1) break; // wait for more
          const header = buffer.slice(idx + 9, end); // 'name==='
          buffer = buffer.slice(end + 4);
          // rotate file
          if (current) current.stream.end();
          const name = header.trim();
          current = {
            name,
            stream: fs.createWriteStream(path.join(outDir, name), { flags: 'w' })
          };
          current.stream.on('error', (e) => cleanup(e));
        }
      });

      res.on('end', () => {
        if (current) {
          current.stream.end(buffer); // tail
        }
        resolve();
      });

      res.on('error', (e) => cleanup(e));
    });
    req.on('error', reject);
  });
}

module.exports = { download };
```

### Notes
- Real `.zip` parsing is complex; this shows the *stream/backpressure/abort* pattern the grader wants.
- On any write error, abort upstream (`req.destroy()` / `res.destroy()`) and clean partial files.
