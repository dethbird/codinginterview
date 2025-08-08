**input-sanitization-and-vulns.md**

# Input Sanitization & Common Vulnerabilities (Node/Express)

## 📌 What & why

**Validation** makes sure inputs have the right *shape/types/ranges*.
 **Sanitization/encoding** makes sure those inputs can’t **break context** (HTML/JS/URL/SQL/FS/OS).
 Goal: accept only what you need, reject the rest, and **encode/escape at output** based on context.

> Golden rule: **Validate on input, encode on output.** Don’t “strip everything”; you’ll delete valid data and still miss context bugs.

------

## 1) SQL Injection (Postgres/MySQL)

### Safe by default: **parameterized queries**

```ts
// pg
await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// mysql2
await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
```

**Arguments & params:** the **values array** (`[email]`) is *not* concatenated into SQL; the driver sends it separately, so `' OR 1=1 --` is harmless.

**Anti-pattern (never):**

```ts
await pool.query(`SELECT * FROM users WHERE email = '${email}'`); // ❌
```

**Knex/Prisma** already parameterize; for **raw SQL**, still bind variables:

```ts
await db.raw('select * from users where email = ?', [email]); // knex
await prisma.$queryRaw`select * from "User" where email = ${email}`; // prisma
```

------

## 2) NoSQL Injection (MongoDB operator tricks)

Attackers send `{ email: { $ne: "" } }`. Always **validate** and **type coerce** to plain strings.

```ts
// Zod: strips objects/operators and coerces types
const Email = z.string().email().toLowerCase();
const parsed = Email.parse(req.body.email);

await users.findOne({ email: parsed });  // safe filter
```

If you accept JSON blobs, **reject keys starting with `$` or containing `.`**:

```ts
function rejectMongoOperators(obj: any) {
  for (const k in obj) {
    if (k.startsWith('$') || k.includes('.')) throw new Error('bad_key');
    if (obj[k] && typeof obj[k] === 'object') rejectMongoOperators(obj[k]);
  }
}
```

------

## 3) XSS (Cross-Site Scripting)

### Default: **escape when rendering HTML**

- **React** auto-escapes `{value}`. Avoid `dangerouslySetInnerHTML`.
- Server templates (EJS/Pug/Nunjucks): ensure **auto-escape on**.

```jsx
// Safe (React escapes by default)
<div>{user.name}</div>

// Unsafe unless sanitized
<div dangerouslySetInnerHTML={{ __html: user.bio }} />
```

### When you must allow limited HTML (e.g., user bios)

Sanitize on **input** or **just before rendering** with an allowlist.

```ts
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DOMPurify = createDOMPurify(new JSDOM('').window as any);
const clean = DOMPurify.sanitize(userHtml, { ALLOWED_TAGS: ['b','i','a','p'], ALLOWED_ATTR: ['href'] });
```

### Output contexts matter

- **HTML text** → escape `& < > " '`.
- **HTML attribute** → also escape backticks, avoid unquoted attrs.
- **URL** → use `encodeURIComponent()` for query parts.
- **JS string** → `JSON.stringify(value)` into script blocks.

------

## 4) Open Redirects

Never redirect to arbitrary user-provided URLs.

```ts
const allow = new Set(['/','/dashboard']);
const to = allow.has(req.query.next) ? req.query.next : '/';
res.redirect(to);
```

If you truly need external URLs, **allowlist hostnames** and check `new URL(next).hostname`.

------

## 5) Path Traversal (files)

```ts
import path from 'node:path';
const root = path.join(process.cwd(), 'uploads');

function safeJoin(root: string, userPath: string) {
  const p = path.join(root, userPath);
  if (!p.startsWith(root + path.sep)) throw new Error('path_traversal');
  return p;
}

const filePath = safeJoin(root, req.params.name); // reject ../../etc/passwd
```

Prefer `path.basename()` for “download by name” endpoints.

------

## 6) Command Injection

Avoid `exec()`; use **`execFile`/`spawn`** with fixed args.

```ts
import { execFile } from 'node:child_process';
execFile('ffmpeg', ['-i', inputPath, '-f', 'mp3', outputPath], (err) => { /* ... */ });
// Never: exec(`ffmpeg -i ${inputPath} ...`)  // ❌
```

**Arguments/params:** Construct argument **arrays**, never interpolate shell strings. Validate file paths as above.

------

## 7) SSRF (Server-Side Request Forgery)

If your API fetches user-provided URLs, **allowlist protocols/hosts** and block private IPs.

```ts
import dns from 'node:dns/promises';
import net from 'node:net';

async function allowUrl(u: string) {
  const url = new URL(u);
  if (!/^https?:$/.test(url.protocol)) throw new Error('bad_proto');
  if (!/^(img\.example\.cdn|api\.trusted\.com)$/.test(url.hostname)) throw new Error('bad_host');

  const addrs = await dns.lookup(url.hostname, { all: true });
  for (const a of addrs) {
    const ip = a.address;
    if (net.isPrivate?.(ip) || /^10\.|^127\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
      throw new Error('private_ip');
    }
  }
  return url.toString();
}
```

Also set **egress firewall** rules and **timeouts** on fetches.

------

## 8) File Uploads (quick security recap)

- **Limit size/count/types** (magic byte check).
- **Generate filenames** (UUID), don’t trust `originalname`.
- **Write atomically** (`flags:'wx'` + temp rename).
- **Stream** to storage; avoid buffering.
- Optional: stream through AV scanner (ClamAV) before accepting.

*(See `file-uploads-busboy-multer.md` section.)*

------

## 9) HTTP Parameter Pollution (HPP)

Multiple query params `?role=user&role=admin` can surprise you. Either **disallow duplicates** or use `hpp`:

```bash
npm i hpp
import hpp from 'hpp';
app.use(hpp({ whitelist: ['tags'] })); // only 'tags' may be repeated
```

------

## 10) CORS Misconfig

- Never use `origin: true` with `credentials: true` and think it’s fine—**allowlist origins**.
- With credentials, `Access-Control-Allow-Origin` **cannot** be `*`.
   *(See `cors-rate-limit-helmet.md`.)*

------

## 11) Prototype Pollution (JS-specific)

Don’t merge untrusted objects directly into configs; guard `__proto__`, `constructor`, `prototype`.

```ts
function safeAssign(target: any, src: any) {
  for (const [k, v] of Object.entries(src)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    if (v && typeof v === 'object') safeAssign(target[k] = target[k] ?? {}, v);
    else target[k] = v;
  }
}
```

Prefer **schema validation** (Zod/Joi) with `.strict()`/`stripUnknown: true`.

------

## 12) ReDoS (catastrophic regex)

Beware of untrusted input through **catastrophic backtracking** regexes.

```ts
// BAD: (a+)+ on long 'aaaaaaaaX' → CPU melt
const re = /(a+)+$/;

// Safer: use RE2 or rewrite
import RE2 from 're2';
const re2 = new RE2('(a+)$'); // library that avoids backtracking blowups
```

Or pre-limit input length and use timeouts in your handlers.

------

## 13) Deserialization / JSON pitfalls

- Don’t `eval()` or `Function()` on strings.
- For YAML/TOML front-matter, use libraries in **safe mode** (no custom tags).
- For JSON, stick to `JSON.parse` and validate the shape.

------

## 14) Rate limiting & brute force

Protect login/otp endpoints with Redis counters or `express-rate-limit`. Return `429`/`401` without leaking which field was wrong.
 *(Covered in `cors-rate-limit-helmet.md`.)*

------

## 15) Secrets handling

- Load from **env**/**vault**, not committed files.
- Avoid dumping `process.env` in logs.
- Rotate periodically; on compromise, **invalidate sessions/tokens**.

------

## Practical Express middleware stack (copy/paste)

```ts
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { validate } from './validate-mw.js'; // from validation notes (Zod)

app.set('trust proxy', true);
app.use(helmet());
app.use(cors({
  origin: (o, cb) => cb(null, !o || /^https:\/\/(app|admin)\.example\.com$/.test(o)),
  credentials: true
}));
app.use(hpp());
app.use(express.json({ limit: '256kb' }));
// Add: rate limits on sensitive routes, CSRF for cookie auth, etc.
```

------

## Realistic examples you’ll use

### Sanitize user-generated HTML then store

```ts
const bio = DOMPurify.sanitize(req.body.bio ?? '', {
  ALLOWED_TAGS: ['p','b','i','a','ul','ol','li','code','pre'],
  ALLOWED_ATTR: ['href','rel','target']
});
await prisma.user.update({ where: { id }, data: { bio } });
```

### Safe download by name

```ts
const name = path.basename(req.params.name).replace(/[^-\w.]/g, '');
const p = safeJoin(UPLOAD_DIR, name);
return pipeline(fs.createReadStream(p), res);
```

### Validate & encode URL params

```ts
const q = z.object({ q: z.string().min(1).max(100) }).parse(req.query);
const url = 'https://api.example.com/search?q=' + encodeURIComponent(q.q);
```

------

## ✅ Interview Tips

- Say **“validate early, encode on output by context (HTML/attr/URL/JS)”**.
- Show a **parameterized query** and a **Mongo operator rejection**.
- Mention **DOMPurify** for rich text, and **avoid dangerouslySetInnerHTML**.
- Call out **path traversal**, **command injection** (`execFile`), **SSRF allowlists**, **ReDoS**.
- Tie it all together with a **secure Express stack**: Helmet, CORS allowlist, HPP, body limits, rate limiting, CSRF (when cookie auth).

------

Want to move on to **08-testing-and-quality/jest-vitest-setup.md** next?