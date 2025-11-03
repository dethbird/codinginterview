# S1 — `retry(fn, opts)`

Goal: Promise-based retry with exponential backoff, optional jitter, `shouldRetry`, and `AbortSignal`.

**Spec**
```js
await retry(() => maybeFlaky(), {
  retries: 3, baseDelayMs: 50, factor: 2, jitter: false,
  shouldRetry: (err, attempt) => true,
  signal
});
```
- delay = `baseDelayMs * factor^(attempt-1)`; if `jitter`, multiply by `Math.random()`
- If `shouldRetry` returns false, reject immediately.
- Abort should reject with `AbortError`.
- Propagate last error after all attempts.
