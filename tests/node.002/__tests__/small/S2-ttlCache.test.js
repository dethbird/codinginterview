import { ttlCache } from '../../S2-ttlCache/index.js';
jest.useFakeTimers();

test('expires keys', () => {
  const c = ttlCache({ defaultTtlMs: 100, sweepIntervalMs: 0 });
  c.set('a', 1);
  expect(c.get('a')).toBe(1);
  jest.advanceTimersByTime(101);
  expect(c.get('a')).toBeUndefined();
  c.close();
});

test('has/delete/size and custom ttl', () => {
  const c = ttlCache({ defaultTtlMs: 1000 });
  c.set('a', 1, 5);
  c.set('b', 2, 1000);
  expect(c.size).toBe(2);
  expect(c.has('a')).toBe(true);
  jest.advanceTimersByTime(6);
  expect(c.has('a')).toBe(false);
  expect(c.delete('b')).toBe(true);
  expect(c.size).toBe(0);
  c.close();
});
