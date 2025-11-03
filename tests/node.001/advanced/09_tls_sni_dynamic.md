# 9) TLS SNI Dynamic Certificates

**Goal:** HTTPS server that serves different certificates per hostname, loaded on first use via `SNICallback` and cached with a small LRU.

### 💎 Gold answer (`tls-sni.js`)
```js
'use strict';
const https = require('https');
const tls = require('tls');
const fsp = require('fs/promises');
const path = require('path');

// Simple LRU for SecureContext objects
class LRU {
  constructor(max = 50) { this.max = max; this.map = new Map(); }
  get(k) {
    if (!this.map.has(k)) return;
    const v = this.map.get(k); this.map.delete(k); this.map.set(k, v); return v;
  }
  set(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
}
const cache = new LRU(100);

// Where certs live. Expect files like "example.com.key" and "example.com.crt"
const CERT_DIR = process.env.CERT_DIR || path.resolve(__dirname, 'certs');

// Try exact host, then wildcard "*.domain.tld"
function candidateNames(host) {
  const names = [host.toLowerCase()];
  const parts = host.split('.');
  if (parts.length >= 2) names.push('*.' + parts.slice(1).join('.'));
  return [...new Set(names)];
}

async function getCtx(hostname) {
  const names = candidateNames(hostname);
  for (const name of names) {
    const hit = cache.get(name);
    if (hit) return hit;
    try {
      const key = await fsp.readFile(path.join(CERT_DIR, `${name}.key`));
      const cert = await fsp.readFile(path.join(CERT_DIR, `${name}.crt`));
      const ctx = tls.createSecureContext({ key, cert });
      cache.set(name, ctx);
      return ctx;
    } catch (e) {
      // try next candidate; swallow ENOENT
      if (e.code !== 'ENOENT') throw e;
    }
  }
  throw new Error(`No certificate for ${hostname}`);
}

const server = https.createServer({
  // Default context (optional: a fallback cert)
  // key: fs.readFileSync('default.key'),
  // cert: fs.readFileSync('default.crt'),
  SNICallback(servername, cb) {
    getCtx(servername).then(ctx => cb(null, ctx)).catch(cb);
  }
}, (req, res) => res.end('ok'));

server.listen(3443, () => {
  console.log('HTTPS SNI server on :3443 (certs from', CERT_DIR, ')');
});
```

### 🧪 Notes & tests
- Put `certs/example.com.key` and `certs/example.com.crt` on disk; curl with SNI:
  ```bash
  curl --resolve example.com:3443:127.0.0.1 https://example.com:3443/ -k -v
  ```
- LRU evicts least-recently-used contexts to cap memory.
- Wildcards: falls back to `*.domain.tld` if exact host missing.

### Edge cases
- Missing cert → callback error, handshake fails.
- You can add a *default* context in `createServer` so unknown hosts still work.
