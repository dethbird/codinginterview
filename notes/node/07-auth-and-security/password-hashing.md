**password-hashing.md**

# Password Hashing (bcrypt, argon2, scrypt)

## 📌 What & why

Store **only hashes**, never plaintext. A password hash is a **slow, salted, one-way** digest so stolen DBs aren’t instantly cracked. Prefer **Argon2id** (memory-hard), then **scrypt**, then **bcrypt** if you must. Always use a **unique salt per user**, consider a server-side **pepper**, and be ready to **rehash** when parameters change.

------

## Algorithms & parameters (what to tune)

### Argon2 (recommended)

- **Type**: `argon2id` (resists GPU side-channel + cracking).
- **Parameters**:
  - `timeCost` (iterations): CPU work.
  - `memoryCost` (KiB/MB): RAM used (the big defense).
  - `parallelism`: lanes/threads.
  - `hashLength`/`saltLength`: bytes (16–32 typical).
- **Tuning rule**: choose the **highest memory** that still gives ~**100–500ms** per hash on your server, then set `timeCost` to reach target latency.

### scrypt (good)

- **Parameters**: `N` (CPU/memory), `r` (block size), `p` (parallelization).
- Target ~**100–500ms** per hash.

### bcrypt (OK, legacy-friendly)

- **Parameter**: `cost` (aka rounds). Each +1 doubles compute.
- Target ~**100–300ms** per hash on your infra.

------

## Node libraries (what you’ll actually import)

- **Argon2**: `argon2` package
- **bcrypt**: `bcrypt` or `bcryptjs` (**avoid** `bcryptjs` in prod; it’s pure JS and slower)
- **scrypt**: built-in `crypto.scrypt` (promisify it)

------

## Schema (what to store)

```sql
-- users table essentials
id uuid pk,
email citext unique not null,
password_hash text not null,          -- e.g., $argon2id$v=19$m=65536,t=3,p=1$...
pwd_algo text not null,               -- 'argon2id' | 'bcrypt' | 'scrypt'
pwd_updated_at timestamptz not null,
pwd_salt bytea null,                  -- usually embedded in hash; keep null unless your lib needs it
pwd_must_change boolean default false
```

> Most libs **embed salt & params** in the hash string (e.g., `$argon2id$v=19$m=65536,t=3,p=1$salt$hash`). That’s good—store just that `password_hash` plus a tiny `pwd_algo` tag.

------

## Argon2: hash & verify (with rehash-on-login)

```ts
import argon2 from 'argon2';

const ARGON_OPTS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  timeCost: 3,              // tune
  memoryCost: 64 * 1024,    // KiB → 64 MiB
  parallelism: 1,
  hashLength: 32,
  saltLength: 16
};

// Hash at signup / reset
export async function hashPassword(plain: string) {
  // Normalize & limit length to avoid DoS on absurd inputs
  const normalized = plain.normalize('NFKC');
  if (normalized.length > 1024) throw new Error('password_too_long');
  return argon2.hash(normalized, ARGON_OPTS); // returns encoded string with params+salt
}

// Verify at login, with optional rehash if params outdated
export async function verifyAndMaybeRehash(plain: string, storedHash: string) {
  const ok = await argon2.verify(storedHash, plain.normalize('NFKC'));
  if (!ok) return { ok: false as const };

  // If we upgraded ARGON_OPTS, rehash transparently:
  const needsRehash = await argon2.needsRehash?.(storedHash, ARGON_OPTS) ?? false;
  if (needsRehash) {
    const newHash = await argon2.hash(plain.normalize('NFKC'), ARGON_OPTS);
    return { ok: true as const, newHash };
  }
  return { ok: true as const };
}
```

**Arguments to know:** `type`, `timeCost`, `memoryCost`, `parallelism`, `hashLength`, `saltLength`.
 **Real-world**: run a startup benchmark to tune until hashes take ~200ms.

------

## bcrypt: hash & verify (if you’re stuck with it)

```ts
import bcrypt from 'bcrypt';
const COST = 12; // tune for ~100-300ms

export async function hashPasswordB(plain: string) {
  return bcrypt.hash(plain.normalize('NFKC'), COST);
}

export async function verifyB(plain: string, hash: string) {
  return bcrypt.compare(plain.normalize('NFKC'), hash); // timing-safe
}
```

**Parameter:** `saltRounds`/`cost`. Increase slowly over years; rehash on login when cost changes.

------

## scrypt (built-in crypto)

```ts
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCb);

const N = 1 << 15; // 32768
const r = 8;
const p = 1;

export async function hashPasswordS(plain: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(plain.normalize('NFKC'), salt, 32, { N, r, p })) as Buffer;
  return `scrypt$N=${N},r=${r},p=${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyS(plain: string, stored: string) {
  const [, params, saltB64, keyB64] = stored.split('$');
  const [nStr, rStr, pStr] = params.replace('N=', '').split(',r=');
  const [rOnly, pOnly] = pStr.split(',p=');
  const Np = Number(nStr), rp = Number(rOnly), pp = Number(pOnly);
  const salt = Buffer.from(saltB64, 'base64');
  const key = Buffer.from(keyB64, 'base64');
  const test = (await scrypt(plain.normalize('NFKC'), salt, key.length, { N: Np, r: rp, p: pp })) as Buffer;
  return timingSafeEqual(key, test);
}
```

**Arguments:** `N` (must be power of 2), `r`, `p`. Increase `N` until ~200ms per hash.

------

## Pepper (optional but nice defense-in-depth)

- A **pepper** is a secret key stored **outside the DB** (env/HSM).
- Append/prepend it during hashing or use as an **HMAC** over the password+salt **before** KDF. If DB leaks without the pepper, hashes are harder to crack.

```ts
import { createHmac } from 'node:crypto';
const PEPPER = process.env.PEPPER!; // keep out of DB backups

function withPepper(pw: string) {
  return createHmac('sha256', PEPPER).update(pw.normalize('NFKC')).digest('hex');
}

// Then pass withPepper(plain) to argon2/bcrypt/scrypt.
// Note: rotating pepper requires forcing password reset or a lazy rehash strategy.
```

------

## Signup & login (Express): realistic flow

```ts
// POST /signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!isStrong(password)) return res.status(422).json({ error: 'weak_password' });
  const hash = await hashPassword(withPepper(password));
  await db.query('INSERT INTO users(email, password_hash, pwd_algo, pwd_updated_at) VALUES ($1,$2,$3,now())',
    [email.toLowerCase(), hash, 'argon2id']);
  res.status(201).json({ ok: true });
});

// POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query('SELECT id, password_hash FROM users WHERE email=$1', [email.toLowerCase()])
    .then(r => r.rows[0]);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const { ok, newHash } = await verifyAndMaybeRehash(withPepper(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  if (newHash) {
    await db.query('UPDATE users SET password_hash=$1, pwd_updated_at=now() WHERE id=$2', [newHash, user.id]);
  }
  // issue session/JWT here
  res.json({ ok: true });
});
```

**Notes**

- **Normalize** password input (`NFKC`) to avoid Unicode edge cases.
- **Never** leak which part failed—use a single `invalid_credentials`.
- Consider **rate-limiting**/IP throttling on the login route.

------

## Password policy & breached-password checks

```ts
export function isStrong(pw: string) {
  // Example baseline: 12+ chars, mix of classes; consider passphrases too.
  return typeof pw === 'string' && pw.length >= 12 &&
         /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}
```

**Have I Been Pwned (k-anonymity)**

- Hash the password with **SHA-1**, send first **5 hex chars** to HIBP API, check if suffix is present.
- If found, **reject** even if your strength rules pass. (Implement with server-side fetch; don’t send full hash.)

------

## Password resets (tokens done right)

- Generate a **random token**: `crypto.randomBytes(32)` → send URL-safe base64.
- **Store only a hash** of the token with an **expiry** (e.g., 15–60 min).
- On use, hash the presented token and compare with `timingSafeEqual`, then delete.

```ts
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function createResetToken() {
  const raw = randomBytes(32).toString('base64url');
  const digest = createHash('sha256').update(raw).digest('base64url');
  return { raw, digest, expiresAt: new Date(Date.now() + 15*60*1000) };
}

export function verifyResetToken(raw: string, storedDigest: string) {
  const d = createHash('sha256').update(raw).digest('base64url');
  return timingSafeEqual(Buffer.from(d), Buffer.from(storedDigest));
}
```

------

## Migrating algorithms (e.g., bcrypt → Argon2)

1. **Accept both** during verify: check bcrypt first; if OK → **rehash** with Argon2 and **update** the record.
2. Over time, most users migrate on login. For stragglers, force reset or run a background “prompt to login”.

```ts
async function verifyAny(plain: string, user: { hash: string; algo: string }) {
  if (user.algo === 'argon2id') {
    const r = await verifyAndMaybeRehash(withPepper(plain), user.hash);
    if (r.ok && r.newHash) await saveNewHash(r.newHash, 'argon2id');
    return r.ok;
  }
  if (user.algo === 'bcrypt') {
    const ok = await verifyB(withPepper(plain), user.hash);
    if (ok) {
      const newHash = await hashPassword(withPepper(plain));
      await saveNewHash(newHash, 'argon2id');
    }
    return ok;
  }
  return false;
}
```

------

## Operational tips (the stuff that bites)

- **Tune & measure**: periodically re-evaluate Argon2 memory/time costs as hardware changes.
- **Protect the hot path**: login attempts should be **rate-limited** and optionally **IP/username throttled** (Redis counter).
- **Lockouts**: after N failed attempts, require CAPTCHA or backoff (don’t perma-lock accounts).
- **Do not log** passwords or raw tokens—ever.
- **Set max length** (e.g., 1024 chars) to avoid pathological inputs.
- **Disable past hashes re-use** (optional): keep a short history if policy requires it.

------

## ✅ Interview Tips

- Explain **salt** vs **pepper**; salt is public & unique per user, pepper is a server secret.
- Prefer **Argon2id** and know its **memory/time/parallelism** knobs.
- Describe **rehash-on-login** to roll out stronger parameters without user friction.
- Mention **breached-password** checks and **rate limiting** on login.
- Show a **reset token** flow that stores **only a token hash** with expiry.

------

Next: **jwt-vs-sessions.md**?