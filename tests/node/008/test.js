// upper-stdin.js
'use strict';
const { Transform } = require('stream');

const upper = new Transform({
  transform(chunk, enc, cb) {
    // TODO: push chunk.toString().toUpperCase()
    cb(null, chunk.toString().toUpperCase());
  }
});

process.stdin.pipe(upper).pipe(process.stdout);