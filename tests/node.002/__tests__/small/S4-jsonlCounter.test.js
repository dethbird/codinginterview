import { jsonlCounter } from '../../S4-jsonlCounter/index.js';
import { Readable } from 'stream';

test('counts valid json lines across chunks', async () => {
  const src = Readable.from(['{"a":1}\n{"b":2', '}\n  \n { "c": 3 }\n']);
  await expect(jsonlCounter(src)).resolves.toBe(3);
});

test('relaxed mode allows trailing comma', async () => {
  const src = Readable.from(['{"a":1},\n{"b":2},\n']);
  await expect(jsonlCounter(src, { relaxed: true })).resolves.toBe(2);
});

test('rejects on stream error', async () => {
  const src = new Readable({ read() {} });
  const p = jsonlCounter(src);
  src.emit('error', new Error('boom'));
  await expect(p).rejects.toThrow('boom');
});
