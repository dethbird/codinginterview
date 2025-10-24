You’ve got it: use `pipeline(rs, gunzip, transform, cb)` and let a tiny `Transform` count `\n` bytes. To handle chunk boundaries, we don’t split strings—we count byte value `0x0A` and remember whether the stream ended with a newline. If the file has data and **doesn’t** end with `\n`, add one more line in `_flush`.

Here’s a clean, test-friendly solution:

```js
// gz-linecount.js
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const { pipeline, Transform } = require('stream');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error(`Usage: node ${path.basename(process.argv[1])} <path.gz>`);
  process.exit(1);
}

let count = 0;

const counter = new Transform({
  transform(chunk, _enc, cb) {
    // Count raw 0x0A bytes — works for UTF-8 and binary safely.
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0x0A) count++;
    }
    // Track if this chunk ends with newline for last-line logic
    this._sawData = true;
    this._lastWasNL = chunk.length > 0 && chunk[chunk.length - 1] === 0x0A;
    cb();
  },
  flush(cb) {
    // If there's data and the file doesn't end with '\n', there's one last line
    if (this._sawData && !this._lastWasNL) count++;
    cb();
  }
});

pipeline(
  fs.createReadStream(file),
  zlib.createGunzip(),
  counter,
  (err) => {
    if (err) {
      // Handles ENOENT, permission issues, and corrupted gzip (zlib errors)
      console.error('Error:', err.message);
      process.exit(1);
    }
    // Print just the number (LC-like)
    console.log(count);
  }
);
```

Why this works:

* **Chunk boundaries:** Counting bytes avoids splitting strings across chunks.
* **Last line w/o `\n`:** `_flush` adds one if the stream didn’t end on a newline.
* **Corrupted gzip:** `createGunzip()` will emit an error; `pipeline` forwards it to the callback for a clean exit.
* **Tiny/huge files:** Same logic; no buffering of the whole file.
