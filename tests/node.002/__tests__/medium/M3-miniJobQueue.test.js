import { miniJobQueue } from '../../M3-miniJobQueue/index.js';

test('runs with concurrency and retries', async () => {
  const q = miniJobQueue({ concurrency: 2, retries: 1 });
  const seen = [];
  const jobs = [
    () => new Promise(r => setTimeout(() => { seen.push('A'); r('A'); }, 30)),
    () => Promise.reject(new Error('fail')),
    () => new Promise(r => setTimeout(() => { seen.push('C'); r('C'); }, 10))
  ];
  const results = [];
  q.on('success', (id, v) => results.push(v));
  q.on('failure', (id, e) => results.push('F'));
  jobs.forEach(j => q.push(j));
  await q.close();
  expect(seen.includes('A')).toBe(true);
  expect(seen.includes('C')).toBe(true);
});
