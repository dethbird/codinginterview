**url-and-querystring.md**

# URL, URLSearchParams, and (legacy) querystring

## 📌 What & why

- **`URL`** (WHATWG URL): robust parser/builder for URLs. Handles protocol, host, path, query, hash, and encoding.
- **`URLSearchParams`**: convenient API for query strings (append, get, set, delete, iterate).
- **`querystring`** (legacy): old Node module; avoid in new code—use `URLSearchParams` instead.

You’ll use these to safely parse **incoming requests**, construct **outbound service calls**, and avoid subtle encoding bugs.

------

## Imports

```js
// Built-in globals in Node 18+
const u = new URL('https://example.com');

// Named import if you prefer explicitness
import { URL, URLSearchParams } from 'node:url';
```

------

## `URL` basics (fields & behavior)

```js
const url = new URL('https://api.example.com:8443/users?id=42#top');

url.protocol   // 'https:'
url.hostname   // 'api.example.com' (no port)
url.port       // '8443'
url.host       // 'api.example.com:8443'
url.origin     // 'https://api.example.com:8443'
url.pathname   // '/users'
url.search     // '?id=42'
url.hash       // '#top'
url.searchParams instanceof URLSearchParams // true

url.toString() // full URL string
```

**Notes**

- `hostname` vs `host`: `host` includes the port.
- `origin` is protocol + `//` + host (with port if present).
- Trailing slashes matter: `new URL('/a', 'https://x/y')` → `https://x/a` (base path replaced).

------

## Construct with a **base URL** (recommended)

```js
// Avoid fragile string concatenation
const base = new URL('https://service.internal/v1/');
const u = new URL('users', base);           // https://service.internal/v1/users
u.searchParams.set('active', '1');          // https://.../users?active=1
```

------

## `URLSearchParams` essentials

```js
const p = new URLSearchParams('?a=1&a=2&b=hello%20world');
p.get('a')        // '1' (first)
p.getAll('a')     // ['1', '2']
p.has('b')        // true
p.set('b', 'hi'); // a single value (replaces all)
p.append('c', '3')
p.delete('a')
p.toString()      // 'b=hi&c=3'
```

**Common gotcha:** `URLSearchParams` values are strings—cast to numbers/booleans yourself.

------

## Real-world: parse an incoming Express URL robustly

```js
app.get('/search', (req, res) => {
  // Reconstruct absolute URL to use WHATWG URL (needs a base)
  const full = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
  const q = full.searchParams;

  // Validate & coerce
  const term = q.get('q')?.trim() ?? '';
  const limit = Math.min(Number(q.get('limit') ?? 20), 100); // cap to 100

  res.json({ term, limit });
});
```

------

## Real-world: forward client query params to upstream API (allowlist)

```js
const ALLOW = new Set(['q', 'page', 'per_page']);

function buildUpstreamUrl(req) {
  const upstream = new URL('/v2/search', process.env.SEARCH_BASE_URL);
  for (const [k, v] of new URL(req.originalUrl, 'http://x').searchParams) {
    if (ALLOW.has(k)) upstream.searchParams.append(k, v);
  }
  // enforce defaults
  if (!upstream.searchParams.has('per_page')) upstream.searchParams.set('per_page', '20');
  return upstream;
}
```

**Why:** Prevents leaking unexpected params (e.g., `admin=true`) to internal services.

------

## Real-world: safe redirects (avoid open-redirect)

```js
function safeRedirect(req, res) {
  const next = req.query.next;
  try {
    const url = new URL(next, `${req.protocol}://${req.get('host')}`);
    // Only allow same-origin redirects
    if (url.origin !== `${req.protocol}://${req.get('host')}`) throw new Error('offsite');
    res.redirect(url.pathname + url.search + url.hash);
  } catch {
    res.redirect('/'); // fallback
  }
}
```

------

## Real-world: build URLs with dynamic path segments

```js
function userProfileUrl(base, userId) {
  const u = new URL(`users/${encodeURIComponent(userId)}`, base);
  return u.toString();
}

userProfileUrl('https://api.example.com/', 'id/with slash'); 
// encodes the slash safely
```

------

## File URLs in Node (ESM-friendly)

```js
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const hereFileUrl = import.meta.url;                 // 'file:///.../yourfile.mjs'
const herePath = fileURLToPath(hereFileUrl);         // '/.../yourfile.mjs'
const cfg = path.join(path.dirname(herePath), 'config.json');

const cfgFileUrl = pathToFileURL(cfg).href;          // 'file:///.../config.json'
```

**Use cases:** locate files relative to the current module in ESM.

------

## IPv6, ports, and encoding edge cases

```js
new URL('http://[::1]:8080/test').host     // '[::1]:8080'
new URL('http://[::1]/test').hostname      // '::1'
new URL('https://x/?q=hello world').search // '?q=hello+world' or encoded form
```

**Tip:** Always let `URL`/`URLSearchParams` handle encoding—avoid manual `%`-encoding.

------

## Legacy `querystring` (avoid for new code)

```js
import querystring from 'node:querystring';

querystring.parse('a=1&b=two');  // { a: '1', b: 'two' }
querystring.stringify({ a: 1 }); // 'a=1'
```

Use only when maintaining older code; prefer `URLSearchParams`.

------

## Error handling & validation

```js
function tryParseUrl(input, base) {
  try {
    return new URL(input, base);
  } catch {
    return null; // invalid URL
  }
}
```

Validate inputs before using them to build redirects or outbound requests.

------

## ✅ Interview Tips

- Prefer `new URL(path, base)` over string concat (handles slashes & encoding).
- Use `URLSearchParams` for queries; remember `.getAll` for multi-valued keys.
- Know **origin/host/hostname/port** differences.
- Mention **allowlists** and **safe redirects** to avoid security pitfalls.

------

Next: **events-and-eventemitter.md** (EventEmitter lifecycle, common arguments, memory leaks, once vs on, and real-world patterns like request-scoped emitters & domain-like error routing).