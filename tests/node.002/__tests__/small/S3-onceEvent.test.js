import { onceEvent } from '../../S3-onceEvent/index.js';
import { EventEmitter } from 'events';

test('resolves with event args', async () => {
  const ee = new EventEmitter();
  const p = onceEvent(ee, 'data', { timeoutMs: 50 });
  ee.emit('data', 7, 8);
  await expect(p).resolves.toEqual([7, 8]);
});

test('times out', async () => {
  const ee = new EventEmitter();
  await expect(onceEvent(ee, 'tick', { timeoutMs: 5 })).rejects.toHaveProperty('name', 'TimeoutError');
});

test('abort works', async () => {
  const ee = new EventEmitter();
  const ac = new AbortController();
  const p = onceEvent(ee, 'x', { signal: ac.signal });
  ac.abort();
  await expect(p).rejects.toHaveProperty('name', 'AbortError');
});
