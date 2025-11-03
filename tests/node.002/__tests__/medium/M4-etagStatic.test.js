import { createServer } from '../../M4-etagStatic/index.js';
import http from 'http';
import fsp from 'fs/promises';
import path from 'path';

function get(port, pathName, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: '127.0.0.1', port, path: pathName, method: 'GET', headers };
    const req = http.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves with ETag and 304', async () => {
  const dir = path.join(process.cwd(), '__tests__', 'medium', 'webroot');
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, 'hello.txt'), 'hi');
  const server = createServer(dir);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const r1 = await get(port, '/hello.txt');
  const etag = r1.res.headers['etag'];
  const r2 = await get(port, '/hello.txt', { 'If-None-Match': etag });
  expect(r2.res.statusCode).toBe(304);
  server.close();
});
