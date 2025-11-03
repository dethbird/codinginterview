import { retry } from '../../S1-retry/index.js';

test('resolves on 3rd attempt with backoff timing', async () => {
  let calls = 0;
  const start = Date.now();
  const result = await retry(async () => {
    calls++;
    if (calls < 3) throw new Error('nope');
    return 42;
  }, { retries: 5, baseDelayMs: 5, factor: 2, jitter: false });
  expect(result).toBe(42);
  expect(calls).toBe(3);
  expect(Date.now() - start).toBeGreaterThanOrEqual(15);
});

test('shouldRetry short-circuits', async () => {
  let calls = 0;
  await expect(retry(async () => {
    calls++; throw new Error('fatal');
  }, { retries: 5, baseDelayMs: 1, shouldRetry: () => false })).rejects.toThrow('fatal');
  expect(calls).toBe(1);
});

test('abort cancels backoff', async () => {
  const ac = new AbortController();
  const p = retry(async () => { throw new Error('x'); }, { retries: 2, baseDelayMs: 50, signal: ac.signal });
  setTimeout(() => ac.abort(), 5);
  await expect(p).rejects.toHaveProperty('name', 'AbortError');
});
