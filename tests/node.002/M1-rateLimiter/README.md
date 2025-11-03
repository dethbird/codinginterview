# M1 — `rateLimiter({ windowMs, max, now })` (Express middleware)

Goal: Sliding-window limiter per IP. Set headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (unix ms when earliest hit expires)

Over limit → 429 with `{ "error": "rate_limited" }`.
