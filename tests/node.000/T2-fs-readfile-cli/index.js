'use strict';
import fs from 'fs/promises';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node index.js <path>');
    process.exit(1);
  }
  // TODO: read file, count lines, console.log the number
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
