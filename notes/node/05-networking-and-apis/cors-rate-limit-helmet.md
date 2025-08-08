**cors-rate-limit-helmet.md**

# CORS, Rate Limiting, and Helmet (security headers)

## 📌 What & why

- **CORS** controls which browsers can call your API from other origins. Get this right to avoid “CORS errors” and accidental data exposure.
- **Rate limiting** protects your API from abuse (bots, credential stuffing, scraper storms).
- **Helmet** sets sane **security headers** (CSP, HSTS, X-Frame-Options, etc.) to harden your app.

------

## CORS (Cross-Origin Resource Sharing)

### Core ideas

- **Origin** = scheme + host + port (e.g., `https://app.example.com:443`).
- Browser sends **preflight** `OPTIONS` for non-simple requests (custom headers, `PUT/DELETE`, `application/json`).
- Response must include the right **`Access-Control-\*`** headers.
- **Cookies/credentials?** You must set `credentials: true` on both client and server **and** you cannot use `*` for `Access-Control-Allow-Origin`.

### Express with `cors` (recommended)

```bash
npm i cors
import cors from 'cors';
import express from 'express';

const app = express();

const allowlist = new Set([
  'https://app.example.com',
  'https://admin.example.com'
]);

app.use(cors({
  origin(origin, cb) {
    // Allow server-to-server/no-origin (curl, mobile apps)
    if (!origin) return cb(null, true);
    cb(null, allowlist.has(origin));
  },
  credentials: true,            // allow cookies/Authorization headers
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  exposedHeaders: ['X-Request-Id'], // headers the browser can read
  maxAge: 600                    // cache preflight (seconds)
}));

// If you need to handle OPTIONS yourself:
// app.options('*', cors()); // let cors lib respond automatically
```

**Notes**

- When `credentials: true`, `Access-Control-Allow-Origin` must echo the **specific** origin (no `*`). The `cors` package handles this when `origin` is a function.
- Consider adding `Vary: Origin` to responses if you serve multiple origins (the `cors` package sets it automatically).
- For public read-only endpoints, you might allow `'*'` and `credentials:false`.

### Manual CORS (for bare http servers or fine control)

```js
function setCors(req, res) {
  const origin = req.headers.origin;
  const ok = origin && /^https:\/\/(app|admin)\.example\.com$/.test(origin);
  if (ok) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '600');
}

if (req.method === 'OPTIONS') {
  setCors(req, res);
  res.writeHead(204).end();
}
```

### Real-world CORS pitfalls

- **Cookies not sent?** Ensure **both** sides set credentials (`fetch(url, { credentials:'include' })` and server `credentials:true` + non-`*` origin).
- **Mixed HTTP/HTTPS** breaks cookies and security policies—go all HTTPS in prod.
- **Proxy/CDN** may strip or override headers—verify at the edge too.

------

## Rate limiting

### Goals

- Throttle abusive clients by **IP**, **token**, or **user-id**.
- Different buckets for different routes (e.g., login stricter than `/health`).
- Use an external **store** (Redis/Memcached) if you run multiple instances.

### Quick start: `express-rate-limit`

```bash
npm i express-rate-limit
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';        // optional: for multi-instance
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 1000,                // 1000 requests per IP per window
  standardHeaders: true,    // adds RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
  store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) })
});

// Apply globally (or just on selected routes)
app.use('/v1/', apiLimiter);

// Stricter for login
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
app.post('/login', loginLimiter, loginHandler);
```

### Token or user-id based limiting (behind auth)

Use a **key generator**:

```js
const perUserLimiter = rateLimit({
  windowMs: 60_000, max: 120,
  keyGenerator: (req) => req.user?.id || req.ip
});
app.use('/v1/private', requireAuth, perUserLimiter);
```

### Sliding window / more advanced

For smoother limiting or penalties, consider:

- **rate-limiter-flexible** (sliding window, Redis)
- **Cloudflare/NGINX** rate limits at the edge (offload before Node)

### Production notes

- **Trust proxy** so `req.ip` is the real client IP behind load balancers:

  ```js
  app.set('trust proxy', true);
  ```

- Log limit hits with the **request id** and path for forensic triage.

- Return `429 Too Many Requests` with `Retry-After` when appropriate.

------

## Helmet (security headers)

### What Helmet sets

- **CSP** (Content Security Policy) — control sources for scripts/styles/frames.
- **HSTS** — enforce HTTPS for future requests.
- **X-Frame-Options** — clickjacking protection.
- **X-Content-Type-Options** — prevent MIME sniffing.
- **Referrer-Policy** — limit referrer leakage.
- **Permissions-Policy** — control APIs like camera/geolocation.

### Install & baseline

```bash
npm i helmet
import helmet from 'helmet';

app.use(helmet({
  // Good defaults; tweak CSP below
  contentSecurityPolicy: false // turn off here if you’ll add a custom CSP later
}));

// Example CSP (tighten as needed)
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "https://cdn.jsdelivr.net"], // allow your CDN(s)
    "style-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"], // inline only if needed
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": ["'self'", "https://api.example.com"],
    "frame-ancestors": ["'self'"], // who can embed you
    // Add Stripe/PayPal domains here if you use their iframes
  }
}));

// HSTS (enable only on HTTPS; includeSubDomains if ready)
app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true, preload: false }));

// Other useful pieces (already included in helmet() defaults but shown for clarity):
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
```

**Tips**

- In **development**, you may temporarily relax CSP or disable it to avoid whack-a-mole while iterating; keep it **strict in prod**.
- If your frontend is on a different origin, make sure `connect-src` covers your API domain.

------

## Bringing it together (minimal secure Express setup)

```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
app.set('trust proxy', true); // behind load balancer/CDN

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || /https:\/\/(app|admin)\.example\.com$/.test(origin)),
  credentials: true,
  maxAge: 600
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// routes...

// 404 + error handlers last
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (!res.headersSent) res.status(500).json({ error: 'internal_error' });
});
```

------

## Troubleshooting & gotchas

- **CORS preflight failing**: verify `OPTIONS` reaches your app (some proxies need config); ensure allowed headers include the ones your client sends (e.g., `Authorization`).
- **Credentials not included**: check both sides (`fetch(..., { credentials:'include' })` **and** server’s `credentials:true` + non-wildcard origin).
- **Over-limiting behind NAT/proxy**: many users share an IP; prefer **user-token** limits post-auth or **CF-Connecting-IP**/`X-Forwarded-For` with `trust proxy`.
- **Helmet CSP blocking**: read the browser console; add necessary sources explicitly (`script-src`, `connect-src`, etc.).
- **Edge caching with multiple origins**: ensure `Vary: Origin` so CDNs don’t mix responses between origins.

------

## ✅ Interview Tips

- Explain **why `credentials:true` forbids `\*` origin** and how you handle multiple origins.
- Show **route-specific** rate limits (e.g., login vs. general API) and **Redis** store for multi-instance.
- Mention **`trust proxy`** and how real client IP is derived behind a load balancer.
- Outline a **CSP** that permits your CDN/api domains and blocks everything else.
- Tie it back to **monitoring**: log 429s and CORS failures with request IDs for debugging.

------

Next: **file-uploads-busboy-multer.md** (streaming uploads, limits, validation, virus scanning hooks, and storing to disk/S3 safely).