Absolutely—here’s a crisp, interview-ready circuit breaker with a proper half-open probe, retryable-error predicate, and tiny tests.

# 2) Circuit Breaker with Half-Open Probe

### Behavior

* **Closed**: calls flow; consecutive **retryable** failures are counted. On `failureThreshold`, transition to **Open**.
* **Open**: reject fast with `BreakerOpenError` until `cooldownMs` elapses.
* **Half-open**: after cooldown, allow up to `halfOpenMax` **probe** calls.

  * If **any retryable failure** happens → back to **Open** (cooldown resets).
  * If **a probe succeeds** and **all** probes finish without retryable failure → **Closed** (counters reset).
* **Non-retryable** errors never advance the breaker; they pass through.

---

### 💎 Drop-in (`circuit-breaker.js`)

```js
// circuit-breaker.js
'use strict';

class BreakerOpenError extends Error {
  constructor(nextTryAt) {
    super('CircuitBreaker: open');
    this.name = 'BreakerOpenError';
    this.nextTryAt = nextTryAt; // ms epoch when half-open may begin
    this.code = 'ERR_BREAKER_OPEN';
  }
}

/**
 * Create a circuit breaker around an async (or sync) function.
 *
 * @param {Function} fn - target function. May be sync or async.
 * @param {Object} [opts]
 * @param {number} [opts.failureThreshold=5] - consecutive retryable failures to open.
 * @param {number} [opts.cooldownMs=10000]   - open state duration before half-open.
 * @param {number} [opts.halfOpenMax=1]      - concurrent probes allowed in half-open.
 * @param {(err:any)=>boolean} [opts.shouldRetry] - classify retryable errors (default: true).
 * @param {(state:string, prev:string)=>void} [opts.onStateChange] - optional hook.
 * @param {()=>number} [opts.now] - inject clock (Date.now by default) for tests.
 */
function circuitBreaker(fn, opts = {}) {
  const {
    failureThreshold = 5,
    cooldownMs = 10_000,
    halfOpenMax = 1,
    shouldRetry = () => true,
    onStateChange,
    now = Date.now,
  } = opts;

  // State
  let state = 'closed'; // 'closed' | 'open' | 'half'
  let consecutiveFailures = 0;
  let openedAt = 0;           // ms epoch when we entered open
  let halfOpenInFlight = 0;   // active probes in half-open

  const setState = (next) => {
    if (state !== next) {
      const prev = state;
      state = next;
      onStateChange?.(next, prev);
    }
  };

  const breakOpen = () => {
    openedAt = now();
    halfOpenInFlight = 0;
    setState('open');
  };

  const maybeEnterHalfOpen = () => {
    if (state !== 'open') return;
    if (now() - openedAt >= cooldownMs) {
      halfOpenInFlight = 0;
      setState('half');
    }
  };

  const closeReset = () => {
    consecutiveFailures = 0;
    halfOpenInFlight = 0;
    setState('closed');
  };

  const callFn = (...args) => Promise.resolve().then(() => fn(...args));

  const wrapped = async (...args) => {
    if (state === 'open') {
      // cooldown gate
      if (now() - openedAt < cooldownMs) {
        const nextTryAt = openedAt + cooldownMs;
        throw new BreakerOpenError(nextTryAt);
      }
      // promote to half-open
      maybeEnterHalfOpen();
    }

    if (state === 'half') {
      if (halfOpenInFlight >= halfOpenMax) {
        // Too many probes → still considered open to callers
        const nextTryAt = openedAt + cooldownMs; // informational
        throw new BreakerOpenError(nextTryAt);
      }
      halfOpenInFlight++;
      try {
        const result = await callFn(...args);
        // Success in half-open: if this was the last probe → close
        halfOpenInFlight--;
        if (halfOpenInFlight === 0) {
          closeReset();
        }
        return result;
      } catch (err) {
        halfOpenInFlight--;
        if (shouldRetry(err)) {
          // Any retryable failure during half-open → reopen
          breakOpen();
        }
        // Pass error through to caller
        throw err;
      }
    }

    // state === 'closed'
    try {
      const result = await callFn(...args);
      consecutiveFailures = 0;
      return result;
    } catch (err) {
      if (shouldRetry(err)) {
        consecutiveFailures++;
        if (consecutiveFailures >= failureThreshold) {
          breakOpen();
        }
      }
      // Non-retryable or not yet at threshold → pass through
      throw err;
    }
  };

  // Optional: expose some introspection (non-spec, but handy in tests)
  Object.defineProperties(wrapped, {
    state: { get: () => state },
    consecutiveFailures: { get: () => consecutiveFailures },
    openedAt: { get: () => openedAt },
  });

  return wrapped;
}

module.exports = { circuitBreaker, BreakerOpenError };
```

---

### 🧪 Tiny tests (paste in a file and run with `node`)

```js
'use strict';
const assert = require('assert/strict');
const { circuitBreaker, BreakerOpenError } = require('./circuit-breaker');

// helper: controllable clock
let t = 0; const now = () => t;

(async () => {
  let calls = 0;
  const retryErr = (msg) => Object.assign(new Error(msg), { retryable: true });
  const nonRetryErr = (msg) => Object.assign(new Error(msg), { retryable: false });

  const fn = async (x) => {
    calls++;
    if (x === 'ok') return 'OK';
    if (x === 'bad') throw retryErr('boom');
    if (x === 'no-retry') throw nonRetryErr('nope');
  };

  const brk = circuitBreaker(fn, {
    failureThreshold: 2,
    cooldownMs: 1000,
    halfOpenMax: 1,
    shouldRetry: (e) => e.retryable === true,
    now,
  });

  // Closed: success resets failures
  assert.equal(await brk('ok'), 'OK');
  assert.equal(brk.state, 'closed');

  // Closed: two consecutive retryable failures → open
  await assert.rejects(() => brk('bad'));
  await assert.rejects(() => brk('bad'));
  assert.equal(brk.state, 'open');

  // While open and inside cooldown → fast fail
  t = 500;
  await assert.rejects(() => brk('ok'), (e) => e instanceof BreakerOpenError);

  // After cooldown → half-open: allow 1 probe
  t = 1000;
  assert.equal(brk.state, 'open');
  // First probe succeeds → close
  assert.equal(await brk('ok'), 'OK');
  assert.equal(brk.state, 'closed');

  // Non-retryable failures do not trip the breaker
  await assert.rejects(() => brk('no-retry'), /nope/);
  assert.equal(brk.state, 'closed');

  console.log('OK');
})();
```

---

### Notes / decisions

* **Concurrency in half-open**: capped by `halfOpenMax`. Extra calls throw `BreakerOpenError` (behaves “open” to callers).
* **First success vs “all probes succeed”**: the implementation closes when **the allowed probes complete and none caused a retryable failure**. With `halfOpenMax=1` this means “first probe success closes”.
* **Error categorization**: via `shouldRetry(err)`—customize for HTTP 5xx / network codes.
* **Time skew**: all timing uses injected `now()` (defaults to `Date.now`) so you can unit-test deterministically.
* **Telemetry**: `onStateChange(next, prev)` hook for logging/metrics; `BreakerOpenError.nextTryAt` helps callers.

This version is lean, testable, and covers the classic breaker state machine with a proper half-open probe.
