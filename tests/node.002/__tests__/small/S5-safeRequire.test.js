import path from 'path';
import fs from 'fs';
import { safeRequire } from '../../S5-safeRequire/index.js';

test('loads json safely', () => {
  const p = path.join(process.cwd(), '__tests__', 'small', 'tmp.json');
  fs.writeFileSync(p, '{"x":1}');
  const r = safeRequire(p);
  expect(r.ok).toBe(true);
  expect(r.value).toEqual({ x: 1 });
  fs.unlinkSync(p);
});

test('captures errors', () => {
  const r = safeRequire('./nope-not-here.json');
  expect(r.ok).toBe(false);
  expect(r.error).toBeInstanceOf(Error);
});
