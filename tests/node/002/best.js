'use strict';
const fs = require('fs');

const raw = fs.readFileSync(0, 'utf8').trim();
const values = raw
  .split(',')
  .map(s => s.trim())
  .filter(s => s !== '' && !isNaN(Number(s)))
  .map(Number);

if (values.length === 0) {
  console.error('No valid numbers found');
  process.exit(1);
}

const min = Math.min(...values);
const max = Math.max(...values);
const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

console.log(`${min.toFixed(2)} ${max.toFixed(2)} ${avg.toFixed(2)}`);