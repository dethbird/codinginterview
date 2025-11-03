## 1) Backpressure-Aware File Copier (manual flow control)

**Goal:** Copy a large file safely without `pipe`, respecting `write()` backpressure.
 **Tests:** `fs.createReadStream`, `fs.createWriteStream`, `drain` event, error handling.

```js
// cp-backpressure.js
'use strict';
const fs = require('fs');

const [src, dest] = process.argv.slice(2);
// TODO: validate args

const rs = fs.createReadStream(src, { highWaterMark: 64 * 1024 });
const ws = fs.createWriteStream(dest);

rs.on('error', onErr);
ws.on('error', onErr);
ws.on('close', () => console.log('done'));

function onErr(err) {
  console.error('Error:', err.message);
  process.exit(1);
}

// TODO: on 'data' -> ws.write(chunk) 
// if write returns false, pause rs until 'drain'
```

**Edge cases:** tiny files, huge files, permission denied, EEXIST overwrite policy.

A) We have now started with question one of intermediate level. Here I will still need some help. I'm guessing highwatermark is to slow down reads since they are faster than writes. I'm also guessing it needs to be like:

```js
rs.on('data', (err, chunk) => {
  // if error then drain
  // else ws.write(chunk)
});
```

But I could use a real answer for my notes.

---

You’re close—`'data'` handlers don’t get an error param; they only get the `chunk`. Backpressure works like this: `ws.write(chunk)` returns **false** when the internal buffer is full. When that happens, **pause** the reader and **resume** it on the writer’s `'drain'`.

Here’s a solid manual-flow copy with overwrite policy, errors, and clean shutdown:

```js
// cp-backpressure.js
'use strict';
const fs = require('fs');
const path = require('path');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// ---- Args ----
const [src, dest, flag] = process.argv.slice(2);
if (!src || !dest) {
  die(`Usage: node ${path.basename(process.argv[1])} <src> <dest> [--force]`);
}
const force = flag === '--force';

// ---- Streams ----
// Prevent accidental overwrite unless --force
const wsFlags = force ? 'w' : 'wx'; // 'wx' -> fail if exists (EEXIST)
const rs = fs.createReadStream(src, { highWaterMark: 64 * 1024 });
const ws = fs.createWriteStream(dest, { flags: wsFlags });

rs.on('error', onErr);
ws.on('error', onErr);
ws.on('close', () => console.log('done'));

// When the reader ends, close the writer (after any buffered writes flush)
rs.on('end', () => {
  ws.end();
});

// Manual backpressure loop:
// - write returns false => pause reader
// - resume on 'drain'
rs.on('data', (chunk) => {
  const canContinue = ws.write(chunk);
  if (!canContinue) {
    rs.pause();
    ws.once('drain', () => rs.resume());
  }
});

function onErr(err) {
  // Give a friendlier EEXIST message when not forcing overwrites
  if (err && err.code === 'EEXIST') {
    console.error(`Error: destination already exists (${dest}). Use --force to overwrite.`);
  } else {
    console.error('Error:', err && err.message ? err.message : err);
  }
  // Ensure both streams are closed on error
  rs.destroy();
  ws.destroy();
  process.exit(1);
}
```

### Why this works

* **`highWaterMark`** sets the max chunk size the reader pushes at a time; it doesn’t “slow” reads by itself, but smaller chunks give the writer a steadier flow.
* **Backpressure:** `write()` returns `false` when the write buffer is full. Pausing the reader prevents memory bloat. The `'drain'` event signals that it’s safe to resume.
* **Tiny/huge files:** same logic; for huge files you’ll see frequent pause/resume cycles.
* **EEXIST policy:** default is **no overwrite** (`'wx'`); pass `--force` to overwrite.

If you ever need the high-level, batteries-included version, `stream.pipeline(rs, ws, cb)` handles errors and backpressure for you—but this one shows the manual gears turning.
