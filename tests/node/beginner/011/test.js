// promisify-readfile.js
'use strict';
const fs = require('fs');

function readFileP(path, encoding = 'utf8') {
  // TODO: return new Promise((resolve, reject) => fs.readFile(...))
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, content) => {
        if (err) {
            reject(err);
        } else {
            resolve(content);
        }
    });
  });
}

// Example usage:
// readFileP(__filename).then(console.log).catch(console.error);
readFileP(__filename).then(console.log).catch(console.error);