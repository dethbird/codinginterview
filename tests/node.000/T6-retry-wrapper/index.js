'use strict';

function sleep(ms) { return new Promise(r => setTimeout(r, Math.max(0, ms))); }

async function retry(fn, { retries = 2, delayMs = 200 } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) { last = e; if (i === retries) break; await sleep(delayMs); }
  }
  throw last;
}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error('Usage: node index.js <url>'); process.exit(1); }

  const res = await retry(async () => {
    const r = await fetch(url);
    if (!r.ok) {
      if (r.status >= 500) throw new Error(`Server ${r.status}`);
      const txt = await r.text();
      throw new Error(`HTTP ${r.status}: ${txt.slice(0,120)}`);
    }
    return r;
  }, { retries: 2, delayMs: 200 });

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    console.log(await res.json());
  } else {
    console.log(await res.text());
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
