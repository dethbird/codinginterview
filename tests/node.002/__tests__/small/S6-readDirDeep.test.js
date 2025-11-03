import fsp from 'fs/promises';
import path from 'path';
import { readDirDeep } from '../../S6-readDirDeep/index.js';

test('yields files recursively with filter', async () => {
  const dir = path.join(process.cwd(), '__tests__', 'small', 'tmpdir');
  await fsp.mkdir(path.join(dir, 'a', 'b'), { recursive: true });
  await fsp.writeFile(path.join(dir, 'a', 'x.txt'), 'x');
  await fsp.writeFile(path.join(dir, 'a', 'b', 'y.txt'), 'y');
  const out = [];
  for await (const p of readDirDeep(dir, { filter: (p) => p.endsWith('.txt') })) out.push(path.basename(p));
  expect(out.sort()).toEqual(['x.txt', 'y.txt']);
});
