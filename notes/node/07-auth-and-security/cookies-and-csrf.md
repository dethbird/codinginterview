**cookies-and-csrf.md**

# Cookies & CSRF (browser auth safely)

## 📌 What & why

**Cookies** carry state between browser requests (sessions, JWTs, prefs). **CSRF** (Cross-Site Request Forgery) abuses the browser auto-sending cookies to make **state-changing** requests without user intent. If you store auth in cookies (sessions or JWT-in-cookie), you **must** address CSRF.

------

## Cookie fundamentals (the flags that matter)

- **`HttpOnly`**: JS can’t read it (`document.cookie`), reduces token theft via XSS.
- **`Secure`**: HTTPS only.
- **`SameSite`**:
  - `Lax` (default in modern browsers): send cookie on top-level **GET** navigations only (no POST/iframe/img).
  - `Strict`: only same-site; can break legit flows (e.g., link from email to logged-in page).
  - `None`: send cross-site, **must** also set `Secure`; needed for cross-site frontends.
- **`Domain`**: omit to scope to exact host. If you need subdomains, set `.example.com` deliberately.
- **`Path`**: default `/`. Narrow if helpful.
- **`Max-Age`/`Expires`**: persistence; session cookies skip them.
- **Prefixes**:
  - `__Host-`**name**: requires `Secure`, no `Domain`, `Path=/`. Best for sensitive auth cookies.
  - `__Secure-`**name**: requires `Secure`. (Weaker than `__Host-`.)

**Size**: per-cookie ~4KB, per-domain ~20–50 cookies. Don’t stuff JWTs with payload.

------

## Set & read cookies (Express)

```js
import express from 'express';
import cookieParser from 'cookie-parser';
const app = express();
app.use(cookieParser());

// Set secure cookie
app.get('/set', (req, res) => {
  const prod = process.env.NODE_ENV === 'production';
  res.cookie('__Host-access', 'token', {
    httpOnly: true,
    secure: prod,
    sameSite: 'lax',
    path: '/'
  });
  res.send('ok');
});

// Read cookie
app.get('/whoami', (req, res) => {
  const token = req.cookies['__Host-access']; // HttpOnly is unreadable by JS, but server sees it
  res.json({ hasToken: !!token });
});
```

------

## CSRF in one minute

If your site trusts **cookies** as auth, the browser will include them on **cross-site** requests (e.g., an attacker’s page posting a form to your `/transfer`), unless you prevent it. CSRF targets **unsafe methods** (POST/PUT/PATCH/DELETE). GETs should be **idempotent** and **side-effect free**.

------

## Defenses (layer them)

1. **SameSite cookies**

- Default to `SameSite=Lax` for auth cookies (often enough for traditional web apps).
- If your frontend is on a **different site** (e.g., `app.example.com` ↔ `api.other.com`) and you need cross-site cookies, set `SameSite=None; Secure` and add **token-based CSRF** protection below.

1. **CSRF tokens** (synchronizer / double-submit)

- Generate a random token per session/request.
- For **HTML forms**, embed a hidden `<input name="_csrf" value="...">`.
- For **fetch/XHR**, send in a header (e.g., `x-csrf-token`).
- Server verifies token matches the one it issued.

1. **Origin/Referer checks**

- For state-changing routes, verify `Origin` or fallback to `Referer` is your allowed origin.
- Won’t help with legacy environments that strip these headers, but a good extra guard.

1. **CORS + custom headers** (API style)

- If your API requires a **custom header** (e.g., `Authorization` or `x-csrf-token`) and **disallows credentials** unless origin is allowlisted, random sites can’t call it with your cookies successfully (preflight fails).
- Still use CSRF tokens when cookies carry auth.

------

## Double-submit token (simple, copy/paste)

```js
import crypto from 'node:crypto';

// Issue a readable CSRF cookie (not HttpOnly, so client JS can echo it in a header)
// Attacker site can't read it due to same-origin policy.
function issueCsrf(req, res) {
  if (!req.cookies.csrf) {
    res.cookie('csrf', crypto.randomUUID(), {
      sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/'
    });
  }
}

// Middleware: require token on unsafe methods
function requireCsrf(req, res, next) {
  if (!/^(POST|PUT|PATCH|DELETE)$/i.test(req.method)) return next();
  const header = req.get('x-csrf-token');
  const cookie = req.cookies.csrf;
  const origin = req.get('origin') || '';
  const okOrigin = !origin || /^https:\/\/(app\.)?example\.com$/.test(origin); // adjust
  if (header && cookie && header === cookie && okOrigin) return next();
  return res.status(403).json({ error: 'csrf' });
}

// Usage
app.use(issueCsrf);
app.post('/transfer', requireCsrf, handler);
```

**Notes**

- Token in **cookie** (readable by JS) + **header** from same page → attacker can’t guess it from another site.
- Add **Origin check** for extra safety.

------

## Using `csurf` (library approach)

```bash
npm i csurf
import csrf from 'csurf';
// Requires either cookie-parser or a session store
const csrfMiddleware = csrf({ cookie: { sameSite: 'lax', secure: prod } });

app.use(csrfMiddleware);

// Server-side template:
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// SPA: expose once so client can send in header for mutating requests
app.get('/csrf', (req, res) => res.json({ token: req.csrfToken() }));

// Validate on POST automatically
app.post('/api/change-email', (req, res) => res.json({ ok: true }));
```

------

## CORS + cookies (cross-site SPA ↔ API)

```js
import cors from 'cors';
app.use(cors({
  origin: ['https://app.example.com'], // allowlist
  credentials: true,                   // allow cookies
  allowedHeaders: ['Content-Type','x-csrf-token'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  maxAge: 600
}));
```

Frontend `fetch` **must** use:

```js
fetch('https://api.example.com/thing', {
  method: 'POST',
  credentials: 'include',
  headers: { 'content-type': 'application/json', 'x-csrf-token': getTokenFromCookieOrEndpoint() },
  body: JSON.stringify(payload)
});
```

------

## Session fixation & login safety

- **Regenerate** session ID on login: prevents an attacker from setting a known `sid` before the victim logs in.

```js
app.post('/login', (req, res, next) => {
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = user.id;
    res.json({ ok: true });
  });
});
```

------

## Patterns that are **not** CSRF-vulnerable

- **Bearer tokens in `Authorization` header** (no cookie) with `credentials: 'omit'` — browsers don’t attach anything implicitly, so classic CSRF doesn’t apply. (Still protect **XSS** and your CORS policy.)
- **Webhooks** you call out to (they’re servers, not browsers) — verify via signatures, not CSRF.

------

## Common pitfalls (and fixes)

- **`SameSite=None` without `Secure`** → cookie rejected. Always pair them.
- **Relying only on SameSite** → some embedders/old browsers break it; keep **tokens** and **Origin** checks.
- **Putting CSRF token in HttpOnly cookie** → client can’t read it to echo; either use a non-HttpOnly CSRF cookie or serve token via `/csrf` endpoint.
- **State-changing GET** → always use POST/PUT/PATCH/DELETE.
- **Cross-subdomain Domain wildcards** → overexposes cookies. Prefer `__Host-` cookies scoped to exact host.

------

## Quick, realistic setup (browser cookie auth)

```js
// 1) Auth cookie
res.cookie('__Host-access', jwt, {
  httpOnly: true, secure: prod, sameSite: 'lax', path: '/'
});

// 2) CSRF cookie (readable) + header check on unsafe methods
res.cookie('csrf', crypto.randomUUID(), { sameSite: 'lax', secure: prod, path: '/' });
app.use(requireCsrf); // from earlier

// 3) CORS allowlist if cross-site
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
```

------

## ✅ Interview Tips

- Define **CSRF** succinctly: “exploits auto-sent cookies to trigger state-changing requests from another site.”
- Explain your layered defense: **SameSite**, **CSRF token (double-submit)**, **Origin checks**, **CORS allowlist**.
- Mention `__Host-` cookies and why they’re safer.
- Call out **session fixation** mitigation (regenerate on login).
- Contrast **cookie-auth (needs CSRF defenses)** vs **bearer header (no CSRF, but watch XSS/CORS)**.

------

Want me to continue with **input-sanitization-and-vulns.md** next, or hop to testing?