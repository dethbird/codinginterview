export function rateLimiter({ windowMs = 1000, max = 5, now = () => Date.now() } = {}) {
  const hits = new Map(); // ip -> [timestamps]
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const t = now();
    const cutoff = t - windowMs;
    const arr = (hits.get(ip) || []).filter(ts => ts > cutoff);
    arr.push(t);
    hits.set(ip, arr);

    const remaining = Math.max(0, max - arr.length);
    const reset = (arr[0] ?? t) + windowMs;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(reset));

    if (arr.length > max) return res.status(429).json({ error: 'rate_limited' });
    next();
  };
}
