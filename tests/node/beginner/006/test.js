// count-lines.js
'use strict';
const fs = require('fs/promises');

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node count-lines.js <file>');
    process.exit(1);
  }
  // TODO: read file, split on \n, handle trailing newline
  const content = await fs.readFile(path, 'utf8');
  if (!content) {
    console.error('Input file was empty');
    process.exit(1);
  }
  const parsed = content
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p !== '');

  console.log(parsed.length);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});