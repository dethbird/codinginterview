import fs from 'fs/promises';
import path from 'path';

export async function* readDirDeep(root, opts = {}) {
  const { filter = () => true, followSymlinks = false, sameDevice = false } = opts;
  const seen = new Set();
  const rootStat = await fs.lstat(root);
  const rootDev = rootStat.dev;

  async function* walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      let lst = await fs.lstat(p);
      if (sameDevice && lst.dev != null && lst.dev !== rootDev) continue;
      if (ent.isSymbolicLink()) {
        if (!followSymlinks) continue;
        const real = await fs.realpath(p);
        if (seen.has(real)) continue;
        seen.add(real);
        lst = await fs.lstat(real);
        if (lst.isDirectory()) yield* walk(real);
        else if (lst.isFile()) { if (filter(real, lst)) yield real; }
      } else if (ent.isDirectory()) {
        yield* walk(p);
      } else if (ent.isFile()) {
        if (filter(p, lst)) yield p;
      }
    }
  }
  yield* walk(root);
}
