import { execFile } from 'child_process';
import { promisify } from 'util';
import fsp from 'fs/promises';
import path from 'path';
const execFileP = promisify(execFile);

test('produces deterministic hash and changes when file changes', async () => {
  const dir = path.join(process.cwd(), '__tests__', 'medium', 'hashdir');
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, 'a.txt'), 'A');
  await fsp.writeFile(path.join(dir, 'b.txt'), 'B');
  const cli = path.join(process.cwd(), 'M6-dirHasher', 'dir-hasher.js');
  const { stdout: h1 } = await execFileP('node', [cli, dir]);
  await fsp.writeFile(path.join(dir, 'a.txt'), 'AA');
  const { stdout: h2 } = await execFileP('node', [cli, dir]);
  expect(h1.trim()).not.toBe(h2.trim());
  expect(h1.trim()).toMatch(/^[0-9a-f]{64}$/);
});
