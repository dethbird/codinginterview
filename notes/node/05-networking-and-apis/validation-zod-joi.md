**validation-zod-joi.md**

# Validation: Zod & Joi (request DTOs, env, coercion)

## 📌 What & why

Validate **inputs at the edge** (HTTP body/query/params/headers, env vars) to keep bad data out of your app and database. Use a schema library to:

- **Coerce** strings from HTTP into numbers/booleans/dates.
- **Validate** types, ranges, formats (email/UUID), and **cross-field rules**.
- **Sanitize/strip unknown** fields.
- Produce a **consistent error shape** for clients.

Below are practical patterns with **Zod** (TypeScript-friendly) and **Joi** (battle-tested, great coercion), plus copy-paste Express middleware.

------

## Zod (TypeScript-first)

### Install

```bash
npm i zod
```

### Core patterns you’ll actually use

```ts
import { z } from 'zod';

// Request DTOs
export const CreateUser = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(1).max(120).trim(),
  // query/path values arrive as strings; coerce where appropriate:
  age: z.coerce.number().int().min(0).max(120).optional(),
  newsletter: z.coerce.boolean().default(false),
});

export type CreateUser = z.infer<typeof CreateUser>; // strong TS type

// Query params for list endpoints
export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt','name']).default('createdAt'),
  dir: z.enum(['asc','desc']).default('asc'),
});

// Path param (reusable)
export const IdParam = z.object({ id: z.string().uuid() });

// PATCH: partial updates with constraints
export const UpdateUser = CreateUser.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field must be provided' }
);

// Cross-field validation (password confirm)
export const PasswordPair = z.object({
  password: z.string().min(8),
  confirm: z.string().min(8),
}).superRefine((val, ctx) => {
  if (val.password !== val.confirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords must match', path: ['confirm'] });
  }
});
```

### Parse vs safeParse (error handling)

```ts
const parsed = CreateUser.safeParse(req.body);
if (!parsed.success) {
  // parsed.error is ZodError; map to 422 response
}
```

### Express middleware (drop-in)

```ts
import { z, ZodSchema } from 'zod';

type Where = 'body' | 'query' | 'params';
export const validate =
  <S extends ZodSchema>(where: Where, schema: S) =>
  (req, res, next) => {
    const result = schema.safeParse(req[where]);
    if (!result.success) {
      const details = result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return res.status(422).json({ error: 'validation_failed', details });
    }
    // Replace with parsed/coerced value
    (req as any)[where] = result.data;
    next();
  };

// Usage:
app.post(
  '/users',
  validate('body', CreateUser),
  (req, res) => res.status(201).json({ id: 'u_123', ...req.body })
);

app.get(
  '/users',
  validate('query', ListQuery),
  (req, res) => res.json(/* list using req.query.page/perPage */)
);

app.get(
  '/users/:id',
  validate('params', IdParam),
  (req, res) => res.json({ id: req.params.id })
);
```

### Env var validation (prevents misconfig at boot)

```ts
import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  ADMIN_TOKEN: z.string().min(20),
});
export const env = Env.parse(process.env); // throws & crashes early if invalid
```

------

## Joi (excellent coercion & rich rules)

### Install

```bash
npm i joi
```

### Core patterns

```js
import Joi from 'joi';

export const createUserJ = Joi.object({
  email: Joi.string().email().lowercase().required(),
  name: Joi.string().trim().min(1).max(120).required(),
  age: Joi.number().integer().min(0).max(120),          // auto-coerces from '42'
  newsletter: Joi.boolean().default(false),             // 'true'/'false' → boolean
}).prefs({ convert: true, abortEarly: false, stripUnknown: true }); // sensible defaults

export const listQueryJ = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  perPage: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt','name').default('createdAt'),
  dir: Joi.string().valid('asc','desc').default('asc'),
}).prefs({ convert: true, abortEarly: false, stripUnknown: true });

// Cross-field example
export const passwordPairJ = Joi.object({
  password: Joi.string().min(8).required(),
  confirm: Joi.string().min(8).required(),
}).custom((v, helpers) => {
  if (v.password !== v.confirm) return helpers.error('any.custom', { message: 'Passwords must match' });
  return v;
}, 'password match');
```

### Express middleware (drop-in)

```js
const validateJ = (where, schema) => (req, res, next) => {
  const { error, value } = schema.validate(req[where]);
  if (error) {
    const details = error.details.map(d => ({ path: d.path.join('.'), message: d.message }));
    return res.status(422).json({ error: 'validation_failed', details });
  }
  req[where] = value; // coerced & stripped
  next();
};

// Usage:
app.post('/users', validateJ('body', createUserJ), (req, res) => res.status(201).json(req.body));
```

### Useful Joi options (rememberables)

- `convert: true` → coerce types (default true)
- `abortEarly: false` → collect all errors
- `stripUnknown: true` → drop unexpected fields (helps API hygiene)
- `presence: 'required' | 'optional'` → global default requirement

------

## Producing a consistent error shape (Zod + Joi)

If you mix libraries, normalize errors for clients:

```js
function toValidationResponse(err) {
  // ZodError
  if (err?.issues) {
    return err.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
  }
  // Joi
  if (err?.details) {
    return err.details.map(d => ({ path: d.path.join('.'), message: d.message }));
  }
  // Fallback
  return [{ path: '', message: String(err?.message || err) }];
}
```

Return as:

```js
res.status(422).json({ error: 'validation_failed', details: toValidationResponse(err) });
```

------

## Real-world validation tips

- **Coercion is key**: HTTP gives you strings; use `z.coerce.*` or Joi `convert: true`.
- **Strip unknown fields** to avoid accidental mass-assignment:
  - Zod: `schema.strict()` (or pick/omit into known DTOs)
  - Joi: `.prefs({ stripUnknown: true })`
- **Boundary checks**: cap `perPage`, enforce max string lengths to protect DBs.
- **Cross-field** rules: `superRefine` (Zod) / `.custom` or `.when` (Joi).
- **Security**: never pass raw request bodies to ORMs; validate first.
- **Reuse schemas**: path `IdParam`, pagination, common headers (e.g., `x-request-id`).

------

## ✅ Interview Tips

- Explain **where** you validate (params, query, body, headers, env) and **why early**.
- Show **coercion** and **stripUnknown** to keep DTOs clean.
- Demonstrate a **middleware wrapper** that replaces `req.body/query/params` with **parsed/coerced** objects.
- Mention **cross-field** checks and **partial updates** for PATCH.
- For TS roles, emphasize **`z.infer`** to keep types in sync with runtime validation.

------

Next: **cors-rate-limit-helmet.md** (CORS config, rate limiting patterns, and security headers with Helmet).