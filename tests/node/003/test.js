// unique-words.js
'use strict';
const fs = require('fs');

const text = fs.readFileSync(0, 'utf8');
// TODO: toLowerCase, replace non-letters with space, split, filter empties
const parsed = text
    .trim().split(/\s+/)
    .map(t => {
        // return t.replace(/[^\p{L}]/gu, '').toLowerCase(); for international unicode
        return t.replace(/[^A-Za-z]/g, '').toLowerCase();
    })
    .filter(t => {
        return t !== '';
    });
// TODO: use Set to count unique
const count = new Set(parsed).size;
console.log(count);

// data1 = 9
// data2 = 7