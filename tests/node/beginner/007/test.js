// cp.js
'use strict';
const fs = require('fs');

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Usage: node cp.js <src> <dest>');
  process.exit(1);
}

const rs = fs.createReadStream(src);
const ws = fs.createWriteStream(dest);

rs.on('error', (e) => {
    console.log(e);
    process.exit(1);
});

ws.on('error', (e) => {
    console.log(e);
    process.exit(1);
});

ws.on('finish', () => {
    process.exit(0);
});

rs.pipe(ws);


// TODO: createReadStream(src).pipe(createWriteStream(dest))
// TODO: handle 'error' on both and 'finish' on writable