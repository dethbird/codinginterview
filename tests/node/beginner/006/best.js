// count-lines.js
'use strict';
const fs = require('fs/promises');

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node count-lines.js <file>');
    process.exit(1);
  }

  const text = await fs.readFile(file, 'utf8');
  const normalized = text.replace(/\r/g, '');
  const lines = normalized.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop(); // ignore final empty from trailing \n

  console.log(lines.length);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
