'use strict';
import express from 'express';

const app = express();
app.use(express.json());

// TODO logger middleware
app.use((req, res, next) => {
  // const start = Date.now();
  // res.on('finish', () => console.error(`${req.method} ${req.url} ${res.statusCode} ${Date.now()-start}ms`));
  next();
});

// TODO routes
// app.get('/health', ...)
// app.post('/echo', ...)

// TODO error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'internal' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
