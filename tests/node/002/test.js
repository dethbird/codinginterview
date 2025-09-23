// csv-stats.js
'use strict';
const fs = require('fs');

const line = fs.readFileSync('data.csv', 'utf8').trim().split(',');
const values = line.filter(l => {
    const cleaned = l.replace(/\s+/g, '').trim();
    return !isNaN(cleaned) && cleaned !== ''; // ignore things that aren't a number
}).map(Number);

const min = Math.min(...values).toFixed(2);
const max = Math.max(...values).toFixed(2);
const avg = (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2);

// TODO: parse into numbers
// TODO: compute min, max, avg to 2 decimals
console.log( `${min} ${max} ${avg}` );


// node best.js < data.csv