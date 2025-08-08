**oauth2-notes.md**

# OAuth 2.0 & OpenID Connect (practical notes)

## 📌 What & why

**OAuth 2.0** is about **delegating authorization** (getting an access token to call an API).
 **OpenID Connect (OIDC)** layers **authentication** on top (ID Token with user info), plus discovery and standard claims.

- Roles: **Client** (your app), **Authorization Server** (Auth0/Okta/Google), **Resource Server** (your API).
- Tokens: **Access Token** (for APIs), **Refresh Token** (to get new access tokens), **ID Token** (who the user is—OIDC).

------

## Flows you’ll actually use (pick the right one)

- **Auth Code + PKCE (public clients)** → **SPAs & mobile**. No client secret in browser; uses code verifier/challenge.
- **Auth Code (confidential clients)** → **server-rendered web apps** with a client secret.
- **Client Credentials** → **machine-to-machine** (no user).
- **Device Code** → TVs/CLI that can’t open a browser login inside the device.

> Avoid the legacy **implicit flow**. Use **PKCE** everywhere you can.

------

## /authorize request (must-know parameters)

```
GET https://issuer/authorize?
  response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=https://app.example.com/callback
  &scope=openid profile email offline_access
  &state=opaque-csrf-token
  &code_challenge=BASE64URL(SHA256(code_verifier))
  &code_challenge_method=S256
  &audience=https://api.example.com        (if your AS supports resource indicators)
  &nonce=random-value                      (OIDC: bind ID token to this request)
```

- **scope**: `openid` switches on OIDC; add `offline_access` if you need **refresh tokens**.
- **state**: CSRF protection for the redirect.
- **nonce**: prevents token replay; check it in the ID token.
- **audience**: ask for a token *for your API* (provider-specific).

------

## OIDC essentials (ID Token)

- A **JWT** signed by the issuer with claims like `iss`, `sub`, `aud`, `exp`, `iat`, `nonce`, `email`, `name`.
- **Do not** use ID Tokens to call APIs. Use the **Access Token**.
- Use the **discovery doc**: `https://issuer/.well-known/openid-configuration` and **JWKS** to verify signatures.

------

## Server web app: Auth Code + PKCE (Express, `openid-client`)

```ts
// npm i openid-client express cookie-parser
import express from 'express';
import cookie from 'cookie-parser';
import { generators, Issuer } from 'openid-client';

const app = express();
app.use(cookie());

// Discover provider (cache this in real code)
const issuer = await Issuer.discover(process.env.OIDC_ISSUER!);
const client = new issuer.Client({
  client_id: process.env.OIDC_CLIENT_ID!,
  client_secret: process.env.OIDC_CLIENT_SECRET!, // omit for pure PKCE public client
  redirect_uris: [process.env.OIDC_REDIRECT!],
  response_types: ['code']
});

app.get('/login', (req, res) => {
  const state = generators.state();
  const nonce = generators.nonce();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  res.cookie('oidc', JSON.stringify({ state, nonce, code_verifier }), { httpOnly: true, sameSite: 'lax', secure: true });
  const url = client.authorizationUrl({
    scope: 'openid profile email offline_access',
    state, nonce, code_challenge, code_challenge_method: 'S256',
    // audience: 'https://api.example.com'
  });
  res.redirect(url);
});

app.get('/callback', async (req, res, next) => {
  try {
    const { state, code_verifier, nonce } = JSON.parse(req.cookies.oidc || '{}');
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(process.env.OIDC_REDIRECT!, params, { state, nonce, code_verifier });
    // tokenSet: { access_token, id_token, refresh_token?, expires_at, ... }
    // Store minimal session server-side:
    req.session.user = { sub: tokenSet.claims().sub, email: tokenSet.claims().email };
    req.session.tokens = { access: tokenSet.access_token, refresh: tokenSet.refresh_token };
    res.redirect('/');
  } catch (e) { next(e); }
});
```

**Why**: `openid-client` handles discovery, PKCE, and token verification; you keep tokens server-side (cookies can hold only a session id).

------

## API (Resource Server): verify JWT access tokens (`jose`)

```ts
// npm i jose
import { createRemoteJWKSet, jwtVerify } from 'jose';

const ISSUER = process.env.OIDC_ISSUER!;
const AUD = 'https://api.example.com';
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export async function requireAuth(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer /i, '');
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER, audience: AUD });
    req.user = { sub: payload.sub, scope: (payload.scope || '').split(' ') };
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
```

- Validates **signature**, **issuer**, **audience**, and **exp** automatically.
- JWKS is **fetched & cached**; handles key rotation.

------

## Machine-to-machine: Client Credentials

```ts
import fetch from 'node-fetch';

async function getAppToken() {
  const r = await fetch(`${process.env.OIDC_ISSUER}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      audience: 'https://api.example.com', // ask for API token
      scope: 'read:reports write:reports'
    })
  });
  const j = await r.json();
  return j.access_token; // cache until expires_in
}
```

*No user. Keep the token in memory with its expiry; rotate before it expires.*

------

## Device Code flow (TV/CLI)

```ts
// Step 1: device code
POST /oauth/device/code { client_id, scope }
// ← { device_code, user_code, verification_uri, expires_in, interval }

// Step 2: show user_code & URL; poll token endpoint with device_code
POST /oauth/token { grant_type: device_code, device_code, client_id }
// ← eventually returns access_token (+ id_token if OIDC)
```

*Great for devices without a good browser; you poll at `interval` seconds.*

------

## Refresh tokens & rotation

- Request with `scope` including `offline_access`.
- Store **server-side** (not in localStorage). For SPAs, use **Authorization Code + PKCE** with refresh **via a backend** (or use a **refresh token rotation** feature from your provider).
- On refresh, many providers **rotate** the refresh token; invalidate the previous one.

------

## Logout & revocation

- **App logout**: clear your session/cookies.
- **Provider logout**: some IdPs support `end_session_endpoint` with `post_logout_redirect_uri`.
- **Token revocation**: `POST /oauth/revoke token=...` to invalidate a refresh/opaque token (provider-specific).
- **Front-channel vs back-channel logout**: advanced SSO topics; know they exist.

------

## Security checklist

- ✅ Use **PKCE (S256)**.
- ✅ Validate **state** (CSRF) and **nonce** (OIDC).
- ✅ Verify tokens with **issuer/audience/exp** and **JWKS**.
- ✅ Keep tokens out of **localStorage**; prefer **HttpOnly cookies** or server session.
- ✅ Keep **access tokens short** (5–15m). Use refresh rotation.
- ✅ Request the **minimal scopes** and correct **audience**.
- ✅ Treat **ID Token ≠ Access Token**.
- ✅ Handle **key rotation** (JWKS) and **clock skew** (±60s).

------

## Common gotchas (and fixes)

- **Using ID token to call API** → APIs expect **access token**; request correct **audience**.
- **Implicit flow in SPAs** → use **Auth Code + PKCE** instead.
- **No `state`/`nonce` checks** → CSRF/replay risk. Always verify.
- **Opaque access token at API** without introspection → either enable **introspection** or switch to **JWT** access tokens verified via JWKS.
- **Mixing tenants/issuers** → validate `iss` strictly; don’t accept tokens from unknown issuers.
- **Leaky scopes** → scope creep gives broader API access than needed; **principle of least privilege**.

------

## Interview sound bites

- “**Auth** vs **OIDC**: OAuth grants access; OIDC proves identity with an **ID token** and discovery (`/.well-known`).”
- “For **SPAs**, I use **Auth Code + PKCE** and keep tokens on the server (or in HttpOnly cookies).”
- “APIs verify JWTs with **JWKS** using `jose`, checking **issuer** and **audience**.”
- “**Client Credentials** for backend-to-backend; add **audience** and narrow **scopes**.”
- “I enable **refresh rotation**, validate **state/nonce**, and avoid **implicit** flow.”

------

## Bonus: DPoP (Sender-constrained tokens)

Some IdPs support **DPoP**: the client proves possession of a private key per request, reducing bearer-token theft risk. If offered, it’s a nice upgrade for SPAs/mobile; otherwise stick with standard bearer tokens + HTTPS.

------

Want me to follow up with **cookies-and-csrf.md** next?