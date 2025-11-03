#!/usr/bin/env node
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

async function* walk(dir, seen = new Set()) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    const lst = await fsp.lstat(p);
    if (lst.isSymbolicLink()) {
      const real = await fsp.realpath(p);
      if (seen.has(real)) continue;
      seen.add(real);
      const st = await fsp.lstat(real);
      if (st.isDirectory()) yield* walk(real, seen);
      else if (st.isFile()) yield real;
    } else if (lst.isDirectory()) {
      yield* walk(p, seen);
    } else if (lst.isFile()) {
      yield p;
    }
  }
}

async function main() {
  const dir = process.argv[2];
  if (!dir) { console.error('Usage: node dir-hasher.js <dir>'); process.exit(1); }
  const root = path.resolve(dir);
  const files = [];
  for await (const f of walk(root)) files.push(f);
  files.sort((a,b) => a.localeCompare(b));
  const h = crypto.createHash('sha256');
  for (const abs of files) {
    const rel = path.relative(root, abs).replace(/\\/g,'/');
    const st = await fsp.stat(abs);
    if (st.size > 5 * 1024 * 1024) continue;
    const data = await fsp.readFile(abs);
    h.update(rel + "\n" + st.size + "\n");
    h.update(data);
  }
  process.stdout.write(h.digest('hex') + "\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => { console.error(err.stack || String(err)); process.exit(1); });
}
