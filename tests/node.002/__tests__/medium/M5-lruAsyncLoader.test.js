import { lruAsyncLoader } from '../../M5-lruAsyncLoader/index.js';

test('dedupes in-flight and evicts LRU', async () => {
  let loads = 0;
  const loader = async k => { loads++; await new Promise(r => setTimeout(r, 10)); return k + '-v'; };
  const lru = lruAsyncLoader(2, loader);
  const p1 = Promise.all([lru.get('a'), lru.get('a'), lru.get('a')]);
  const v1 = await p1;
  expect(new Set(v1).size).toBe(1);
  expect(loads).toBe(1);
  await lru.get('b'); // cache: a,b
  await lru.get('c'); // evict a -> cache: b,c
  expect(lru.has('a')).toBe(false);
  expect(lru.has('b')).toBe(true);
  expect(lru.has('c')).toBe(true);
});
