// graceful.js
'use strict';
const http = require('http');
const server = http.createServer((req, res) => res.end('ok'));

server.listen(3000, () => console.log('up'));

function shutdown(signal) {
  console.error(`Received ${signal}. Shutting down...`);
  // TODO: server.close(cb) then process.exit(0) (or set a timeout fallback)
    server.close(() => {
        process.exit(0);
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));