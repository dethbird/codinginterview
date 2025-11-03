// server-basic.js
'use strict';
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const { method, pathname } = { method: req.method, pathname: url.pathname };

  // GET /health
  if (method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  // POST /echo
  if (method === 'POST' && pathname === '/echo') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // ~1MB limit
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'payload_too_large' }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        sendJson(res, 200, data);
      } catch {
        sendJson(res, 400, { error: 'invalid_json' });
      }
    });
    return;
  }

  // Default 404
  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
