✅ Excellent — this one is a must-know for any backend developer. Here’s the **gold standard** version (using `jsonwebtoken`) with clear explanations and a few security notes.

---

# 9) JWT Auth Middleware (HS256)

### 💡 What it does

Checks for a valid
`Authorization: Bearer <token>` header.
If valid → `req.user = decoded payload` and calls `next()`.
If invalid → sends **401 Unauthorized**.

---

### 💎 Gold answer (`jwt-auth.js`)

```js
// jwt-auth.js
'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * Middleware to verify JWT in Authorization header (HS256)
 */
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid auth scheme' });
  }

  try {
    // Verify signature + expiration (throws on failure)
    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid or malformed token' });
  }
}

// Example route
app.get('/me', auth, (req, res) => {
  res.json(req.user);
});

// --- helper route to generate a token for testing ---
app.get('/login', (req, res) => {
  const token = jwt.sign({ id: 123, name: 'Alice' }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  res.json({ token });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

---

### 🧪 Try it

```bash
# 1) Get a token
$ curl http://localhost:3000/login
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# 2) Use the token
$ curl -H "Authorization: Bearer <token>" http://localhost:3000/me
{"id":123,"name":"Alice","iat":...,"exp":...}

# 3) Invalid / expired token
$ curl -H "Authorization: Bearer badtoken" http://localhost:3000/me
{"error":"Invalid or malformed token"}
```

---

### ⚙️ Explanation

| Step                           | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `req.headers['authorization']` | Read the raw header safely          |
| `.split(' ')`                  | Separate `"Bearer"` from the token  |
| `jwt.verify(token, SECRET)`    | Checks signature and expiration     |
| `req.user = payload`           | Attach claims for downstream routes |
| `401` on any failure           | Prevents accidental access          |

---

### 🧠 Edge cases & bonus

* **Missing header** → handled first with `401`.
* **Wrong scheme** (e.g. `Basic foo`) → `401`.
* **Expired token** → distinguish via `err.name === 'TokenExpiredError'`.
* **Malformed token** → generic `401 Invalid or malformed token`.
* **No secret** → must be consistent across sign/verify; in production use a long random key (≥32 bytes).
* **Performance:** `jsonwebtoken.verify` is synchronous for HS256 — fine for low traffic; use the async form for higher throughput.

---

### 🔒 Bonus: manual verify via `crypto` (no dependency)

If libraries are disallowed:

```js
const crypto = require('node:crypto');

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function verifyHS256(token, secret) {
  const [headerB64, payloadB64, sigB64] = token.split('.');
  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  if (expected !== sigB64) throw new Error('Bad signature');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Expired');
  return payload;
}
```

---

### ✅ Key takeaway

* Always enforce the `Bearer` scheme.
* Always handle `expired` vs. generic failure separately.
* Never trust JWTs without verifying the signature.
* Attach only the decoded payload, **never** overwrite `req` properties like `req.headers` or `req.params`.
