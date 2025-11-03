export function jsonlCounter(readable, opts = {}) {
  const { relaxed = false } = opts;
  return new Promise((resolve, reject) => {
    let buf = ''; let count = 0;
    function handle(line) {
      const s = line.trim(); if (!s) return;
      let t = s;
      if (relaxed && /,+$/.test(t)) t = t.replace(/,+$/, '');
      try { JSON.parse(t); count++; } catch {}
    }
    readable.setEncoding('utf8');
    readable.on('data', chunk => {
      buf += chunk;
      const parts = buf.split(/\r?\n/);
      buf = parts.pop();
      for (const line of parts) handle(line);
    });
    readable.on('end', () => { if (buf) handle(buf); resolve(count); });
    readable.on('error', reject);
  });
}
