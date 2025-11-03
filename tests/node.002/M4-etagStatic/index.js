import http from 'http';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MIME = { '.txt':'text/plain', '.json':'application/json', '.js':'text/javascript', '.html':'text/html', '.css':'text/css' };

function etagFor(stats, buf) {
  const hash = crypto.createHash('sha1').update(buf).digest('hex');
  return `W/"${stats.size}-${hash}"`;
}

export function createServer(root) {
  return http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; return res.end('method'); }
      const url = new URL(req.url, 'http://x');
      const unsafe = decodeURIComponent(url.pathname);
      const safe = path.normalize(unsafe).replace(/^\/+/, '');
      if (safe.includes('..')) { res.statusCode = 400; return res.end('bad'); }
      const full = path.join(root, safe || 'index.html');
      const st = await fsp.stat(full);
      if (!st.isFile()) { res.statusCode = 404; return res.end('nf'); }
      const data = await fsp.readFile(full);
      const et = etagFor(st, data);
      res.setHeader('ETag', et);
      if (req.headers['if-none-match'] === et) { res.statusCode = 304; return res.end(); }
      const ext = path.extname(full).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      const range = req.headers['range'];
      if (range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(range);
        const total = data.length;
        if (!m) { res.statusCode = 416; return res.end(); }
        let start = m[1] ? parseInt(m[1], 10) : 0;
        let end = m[2] ? parseInt(m[2], 10) : total - 1;
        if (isNaN(start) || isNaN(end) || start > end || end >= total) { res.statusCode = 416; return res.end(); }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', String(end - start + 1));
        if (req.method === 'HEAD') return res.end();
        return res.end(data.subarray(start, end + 1));
      } else {
        res.setHeader('Content-Length', String(data.length));
        if (req.method === 'HEAD') return res.end();
        return res.end(data);
      }
    } catch (e) { res.statusCode = 404; res.end('nf'); }
  });
}
