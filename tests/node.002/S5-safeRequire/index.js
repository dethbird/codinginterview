import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const req = createRequire(import.meta.url);

export function safeRequire(p) {
  try {
    if (p.endsWith('.json')) {
      const s = fs.readFileSync(p, 'utf8');
      return { ok: true, value: JSON.parse(s) };
    } else {
      const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      const mod = req(abs);
      return { ok: true, value: mod };
    }
  } catch (error) {
    return { ok: false, error };
  }
}
