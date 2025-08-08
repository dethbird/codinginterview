'use strict';

const fs = require('fs');

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', function(inputStdin) {
    inputString += inputStdin;
});

process.stdin.on('end', function() {
    inputString = inputString.split('\n');

    main();
});

function readLine() {
    return inputString[currentLine++];
}

/*
 * Complete the 'aPlusB' function below.
 *
 * The function is expected to return a STRING_ARRAY.
 * The function accepts STRING_ARRAY transactions as parameter.
 */

function aPlusB(lines) {
    // Write your code here
    // Run addition on each line
    const results = [];
    for (const line of lines) {
        // split on space
        const [a, b] = line.split(' ').map(str => Number(str));
        results.push(String(a + b));
    }

    return results;
}

function main() {
    const ws = process.stdout;
    const problems = parseInt(readLine().trim()); // first line is the problem count

    let lines = [];
    for (let i = 0; i < problems; i++) {
        const line = readLine();
        lines.push(line);
    }

    const result = aPlusB(lines);

    ws.write(result.join('\n'));
    ws.write('\n');
    ws.end();
}
