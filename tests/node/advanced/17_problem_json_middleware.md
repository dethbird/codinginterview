# 17) Problem+JSON Error Normalizer (RFC 7807)

**Goal:** Express error normalizer to `application/problem+json` with ALS correlation id.

### 💎 Gold answer (`problem-json.js`)
```js
'use strict';
const express = require('express');
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();
const app = express();

// Request-id middleware
app.use((req, res, next) => {
  const id = req.get('x-request-id') || Math.random().toString(36).slice(2);
  als.run({ id }, next);
  res.set('x-request-id', id);
});

// Example route
app.get('/boom', (req, res) => {
  const e = new Error('Something exploded');
  e.status = 400;
  throw e;
});

// Error handler → problem+json
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = Number(err.status || 500);
  const titles = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error' };
  const title = err.title || titles[status] || 'Error';
  const instance = req.originalUrl;
  const type = err.type || 'about:blank';
  const detail = err.message;

  const id = als.getStore()?.id;
  res.status(status).type('application/problem+json').json({ type, title, status, detail, instance, 'correlation-id': id });
});

app.listen(3000, () => console.log('problem+json on :3000'));
```
