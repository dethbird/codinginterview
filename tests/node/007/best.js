// cp.js
'use strict';
const fs = require('fs');

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Usage: node cp.js <src> <dest>');
  process.exit(1);
}

const rs = fs.createReadStream(src);
const ws = fs.createWriteStream(dest); // or { flags: 'wx' } to prevent overwrite

let exited = false;
const exitOnce = (code) => {
  if (!exited) {
    exited = true;
    process.exit(code);
  }
};

rs.once('error', (err) => {
  console.error(`Read error (${src}): ${err.code || ''} ${err.message}`);
  ws.destroy();           // stop writing
  exitOnce(1);
});

ws.once('error', (err) => {
  console.error(`Write error (${dest}): ${err.code || ''} ${err.message}`);
  rs.destroy();           // stop reading
  exitOnce(1);
});

ws.once('finish', () => {
  // data flushed to OS buffers; write stream ended successfully
  exitOnce(0);
});

rs.pipe(ws);
