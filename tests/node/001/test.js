// sum-stdin.js
'use strict';

const fs = require('fs');

const input = fs.readFileSync('01.txt', 'utf8').trim().split(/\s+/);
let idx = 0;
const next = () => input[idx++];

const n = Number(next());
let sum = 0;

for (let i = 0; i < n; i++) {
    sum += Number(next());
}

console.log(sum);