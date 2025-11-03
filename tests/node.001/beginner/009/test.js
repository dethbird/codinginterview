// server-basic.js
'use strict';
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
    // TODO: route on method + url
    // TODO: for POST /echo read body (collect chunks), set content-type, return JSON
    // TODO: default 404
    console.log(req.method, req.url);

    if (req.method === 'GET' && req.url === '/health') { 
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({'status': 'ok' }));
        return;
    }

    if (req.method === 'POST' && req.url === '/echo') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(body));
        });
        return;
    }

    // Default 404 response
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});