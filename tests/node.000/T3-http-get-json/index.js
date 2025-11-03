'use strict';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node index.js <url>');
    process.exit(1);
  }
  // TODO: validate, use AbortController(2000ms), fetch, handle non-2xx, print JSON
}

main().catch(err => {
  if (err?.name === 'AbortError') console.error('Request timed out');
  else console.error('Error:', err.message);
  process.exit(1);
});
