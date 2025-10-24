// logger-mw.js
'use strict';
const http = require('http');

function withLogging(handler) {
  return (req, res) => {
    const start = Date.now();
    res.on('finish', () => {
      const dur = Date.now() - start;
      console.error(`${req.method} ${req.url} ${res.statusCode} ${dur}ms`);
    });
    handler(req, res);
  };
}

// TODO: pass withLogging(yourHandler) to http.

const server = http.createServer(async (req, res) => {

  // Basic routing
  if (req.method === 'GET' && req.url?.startsWith('/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  res.writeHead(404).end();
});