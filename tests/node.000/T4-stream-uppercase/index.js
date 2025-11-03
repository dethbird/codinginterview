'use strict';
import { Transform } from 'stream';

const upper = new Transform({
  transform(chunk, enc, cb) {
    // TODO: this.push(chunk.toString('utf8').toUpperCase());
    cb();
  }
});

process.stdin.pipe(upper).pipe(process.stdout);
