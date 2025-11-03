import express from 'express';
import request from 'supertest';
import { rateLimiter } from '../../M1-rateLimiter/index.js';

test('limits after max within window and sets headers', async () => {
  const app = express();
  const seq = [0, 100, 200, 300, 400, 500];
  app.use(rateLimiter({ windowMs: 500, max: 3, now: () => seq.shift() ?? Date.now() }));
  app.get('/x', (req, res) => res.json({ ok: true }));

  await request(app).get('/x').expect(200);
  await request(app).get('/x').expect(200);
  await request(app).get('/x').expect(200);
  const r = await request(app).get('/x');
  expect(r.status).toBe(429);
  expect(r.headers['x-ratelimit-limit']).toBe('3');
  expect(r.headers['x-ratelimit-remaining']).toBe('0');
});
