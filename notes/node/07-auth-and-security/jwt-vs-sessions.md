**jwt-vs-sessions.md**

# JWT vs Sessions (Auth tokens, cookies, rotation)

## 📌 What & why

Two common ways to keep users logged in:

- **Cookie sessions (stateful)**: the server stores session state (in memory/Redis/DB). The browser just holds a **session id** cookie.
- **JWTs (stateless)**: the server issues a signed token that **contains claims**; no server read needed to validate (until you need revocation/rotation).

Use **sessions** for classic web apps (SSR, same-origin). Use **JWTs** when you need **API-first**, multiple consumers, or you’re integrating with **OAuth/OpenID**. In practice, both are valid — the important bit is doing cookies/claims/rotation **correctly**.

------

## Core concepts & parameters (you’ll be asked about)

### Session cookies (stateful)

- **Server-side state**: `sid -> userId, roles, lastSeen…` in Redis.
- **Cookie flags**:
  - `HttpOnly`: JS can’t read the cookie (mitigates XSS steal).
  - `Secure`: only over HTTPS.
  - `SameSite`: `Lax` for most apps; `None` for cross-site (must be `Secure`).
  - `Domain`/`Path`: scope the cookie.
  - `Max-Age` vs `Session` cookie.

### JWT (JSON Web Token)

- **Header**: `{ alg: "HS256" | "RS256", typ: "JWT" }`
- **Payload (claims)**: `sub` (user id), `exp`, `iat`, `nbf`, `iss`, `aud`, `jti`, `scope/roles`.
- **Signature**: HMAC (HS*) or RSA/ECDSA (RS*/ES*).
- **Expiry**: short **access token** (5–15 min) + long **refresh token** (days/weeks).
- **Rotation**: refresh token replaced on each use; old one invalidated (prevents replay).

> Interview one-liner: “Sessions are easier to revoke; JWTs are easy to validate anywhere. I keep access tokens short, refresh tokens stored server-side with rotation, and always use `HttpOnly` cookies for browser flows.”

------

## Option A — Cookie sessions (Express + Redis)

### Install

```bash
npm i express-session connect-redis redis
```

### Setup (arguments & middleware)

```js
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();
const RedisStore = connectRedis(session);

app.set('trust proxy', true); // behind load balancer/CDN

app.use(session({
  name: 'sid',                        // cookie name
  secret: process.env.SESSION_SECRET, // used to sign the cookie
  store: new RedisStore({ client: redis, prefix: 'sess:' }),
  resave: false,                      // don't re-save unmodified sessions
  saveUninitialized: false,           // don’t set empty sessions
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',                  // 'none' for cross-site frontends
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}));
```

### Login / logout (realistic)

```js
app.post('/login', async (req, res) => {
  const user = await verifyCreds(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  req.session.userId = user.id;          // attach to session
  req.session.roles = user.roles || [];
  res.json({ ok: true });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.clearCookie('sid').json({ ok: true }));
});

// Guard
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'unauthorized' });
  next();
}
```

**Pros:** easy revocation (`store.del(sid)`), small cookies, CSRF-safe by default with same-site.
 **Cons:** needs session store; sticky sessions or a shared store; not great for non-browser clients unless you carry cookies.

------

## Option B — JWT access + refresh (cookies, rotation)

### Install

```bash
npm i jsonwebtoken
```

### Token helpers (params that matter)

```js
import jwt from 'jsonwebtoken';
const ACCESS_TTL = '10m';  // short-lived
const REFRESH_TTL = '14d'; // long-lived
const ISSUER = 'your.app';
const AUD = 'your.api';

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, roles: user.roles || [] },
    process.env.JWT_PRIVATE || process.env.JWT_SECRET,
    { algorithm: process.env.JWT_PRIVATE ? 'RS256' : 'HS256', expiresIn: ACCESS_TTL, issuer: ISSUER, audience: AUD }
  );
}

function signRefresh(jti, user) {
  return jwt.sign(
    { sub: user.id, jti }, // jti = unique id for revoke/rotate
    process.env.JWT_PRIVATE || process.env.JWT_SECRET,
    { algorithm: process.env.JWT_PRIVATE ? 'RS256' : 'HS256', expiresIn: REFRESH_TTL, issuer: ISSUER, audience: AUD }
  );
}
```

### Store refresh tokens server-side (revocation & rotation)

Use Redis to map `jti -> userId & status`.

```js
import { randomUUID } from 'node:crypto';
import { redis } from './redis.js'; // from earlier notes

async function issuePair(user) {
  const jti = randomUUID();
  await redis.hSet(`rt:${jti}`, { userId: user.id, valid: '1' });
  await redis.expire(`rt:${jti}`, 14*24*3600);
  const access = signAccess(user);
  const refresh = signRefresh(jti, user);
  return { access, refresh };
}
```

### Send tokens as **HttpOnly cookies** (browser-safe)

```js
function setAuthCookies(res, { access, refresh }) {
  const prod = process.env.NODE_ENV === 'production';
  res.cookie('access', access, { httpOnly: true, secure: prod, sameSite: 'lax', path: '/', maxAge: 10*60*1000 });
  res.cookie('refresh', refresh, { httpOnly: true, secure: prod, sameSite: 'lax', path: '/auth/refresh', maxAge: 14*24*3600*1000 });
}
```

### Login / refresh / logout routes

```js
// POST /login
app.post('/login', async (req, res) => {
  const user = await verifyCreds(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  const pair = await issuePair(user);
  setAuthCookies(res, pair);
  res.json({ ok: true });
});

// POST /auth/refresh (rotation)
app.post('/auth/refresh', async (req, res) => {
  const token = req.cookies.refresh;
  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC || process.env.JWT_SECRET, { algorithms: ['RS256','HS256'], issuer: ISSUER, audience: AUD });
    const key = `rt:${payload.jti}`;
    const meta = await redis.hGetAll(key);
    if (meta?.valid !== '1') return res.status(401).json({ error: 'revoked' });

    // rotate: invalidate old, issue new
    await redis.hSet(key, { valid: '0' });
    const user = { id: payload.sub, roles: JSON.parse(meta.roles || '[]') }; // store roles if needed
    const pair = await issuePair(user);
    setAuthCookies(res, pair);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'invalid_refresh' });
  }
});

// POST /logout
app.post('/logout', async (req, res) => {
  const token = req.cookies.refresh;
  try {
    const { jti } = jwt.decode(token) || {};
    if (jti) await redis.hSet(`rt:${jti}`, { valid: '0' });
  } finally {
    res.clearCookie('access'); res.clearCookie('refresh');
    res.json({ ok: true });
  }
});
```

### Access guard (verify on each request)

```js
function requireJwt(req, res, next) {
  const token = req.cookies.access || (req.get('authorization')||'').replace(/^Bearer /i,'');
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC || process.env.JWT_SECRET, { algorithms: ['RS256','HS256'], issuer: ISSUER, audience: AUD });
    req.user = { id: payload.sub, roles: payload.roles || [] };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
```

**Pros:** stateless access checks, easy multi-service validation, works great for mobile/native.
 **Cons:** revocation is **not** built-in — you need refresh token storage/rotation or a token blacklist; **do not** put secrets/PII in JWT payloads.

------

## Security checklists (copy into your notes)

### Cookies

- ✅ `HttpOnly`, ✅ `Secure` (prod), ✅ `SameSite=Lax` (or `None` for cross-site)
- ✅ Short-lived access cookie; refresh on a separate path (`/auth/refresh`)
- ✅ CSRF: for cookie-based auth, put refresh on **POST** with **CSRF protection** (double-submit token or SameSite+custom header) if cross-site is possible.

### JWT claims

- ✅ Always set `iss`, `aud`, `sub`, `exp`, `iat`; optionally `nbf`, `jti`
- ✅ Keep payload **small** (ids/roles/scope only)
- ✅ Validate **algorithm** & **issuer/audience** on verify
- ✅ Clock skew: allow ±`60s` leeway if needed

### Keys

- ✅ Prefer **RS256** (public key verification across services)
- ✅ Rotate secrets/keys; keep old keys around until all tokens expire
- ✅ For HS256, keep the secret strong (256-bit) and **never** expose it to clients

### Revocation & rotation

- ✅ Short access token TTL (5–15m)
- ✅ Refresh token **rotation** with server-side store (Redis)
- ✅ Invalidate on logout/password change/all-devices logout

------

## Choosing in interviews (rule-of-thumb answers)

- **SPA + API (same domain)** → *Either works*. I lean **cookie session** for simplicity & revocation ease.
- **Mobile apps / multiple backends** → **JWT** with short access + refresh (rotation).
- **Third-party integration / OAuth** → JWT is natural; stick to standard claims and RS256.
- **High-security** → sessions or JWT with strict rotation, device binding, IP checks, and anomaly detection.

------

## Common pitfalls (and fixes)

- Storing JWT in **localStorage** → XSS can steal it. *Use HttpOnly cookies.*
- Long-lived access tokens → stale perms & bigger breach blast radius. *Keep them short; use refresh.*
- No rotation on refresh → stolen refresh can be replayed. *Rotate & invalidate the old `jti`.*
- Forgetting CSRF with cookie JWT → cross-site POST can refresh silently. *Protect refresh route with CSRF token or SameSite + custom header checks.*
- Overstuffed JWT (emails, names, prefs) → leaks on every request. *Only `sub`, `roles/scope`, minimal metadata.*

------

## Quick snippets (copy/paste)

**Authorize by role**

```js
function requireRole(role) {
  return (req, res, next) =>
    req.user?.roles?.includes(role) ? next() : res.status(403).json({ error: 'forbidden' });
}
```

**Attach CSRF token for refresh flow**

```js
// On page load, set a non-HttpOnly CSRF cookie or send header
app.use((req, res, next) => {
  if (!req.cookies.csrf) res.cookie('csrf', crypto.randomUUID(), { sameSite: 'lax', secure: prod });
  next();
});

app.post('/auth/refresh', (req, res, next) => {
  if (req.get('x-csrf-token') !== req.cookies.csrf) return res.status(403).json({ error: 'csrf' });
  next();
}, refreshHandler);
```

------

## ✅ Interview Tips

- Define **sessions vs JWTs** crisply; call out **revocation** and **where you store state**.
- Mention **HttpOnly/Secure/SameSite** cookies and **CSRF** considerations.
- Explain **access+refresh** with **rotation** and how you store/check `jti`.
- Prefer **RS256** for multi-service validation; talk about **key rotation**.
- Keep payloads minimal; never put secrets or PII in JWTs.

------

Next: **oauth2-notes.md**, or want to jump to **cookies-and-csrf.md**?