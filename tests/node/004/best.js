// dedup-sort.js
'use strict';
const fs = require('fs');

const raw = fs.readFileSync(0, 'utf8').trim();
if (raw === '') {
  console.log('');
  process.exit(0);
}

const nums = raw.split(/\s+/).map(Number);

// Filter to finite numbers only, dedup with Set, then numeric sort
const uniqueSorted = Array.from(new Set(nums.filter(Number.isFinite)))
  .sort((a, b) => a - b);

console.log(uniqueSorted.join(' '));