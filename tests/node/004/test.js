// dedup-sort.js
'use strict';
const fs = require('fs');

const nums = fs.readFileSync(0, 'utf8').trim().split(/\s+/).map(Number);
// TODO: remove NaN, dedup, sort numerically
const filtered = Array.from(new Set(nums.filter(n => !isNaN(n))));
const sorted = filtered.sort((a,b) => a - b);

console.log(sorted.join(' '));