export async function retry(fn, opts = {}) {
  const {
    retries = 3, baseDelayMs = 50, factor = 2, jitter = false,
    shouldRetry = () => true, signal
  } = opts;
  let last;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt > retries || !shouldRetry(e, attempt)) throw e;
      const base = baseDelayMs * Math.pow(factor, attempt - 1);
      const ms = jitter ? Math.floor(base * Math.random()) : base;
      await sleep(ms, signal);
    }
  }
  throw last;
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { cleanup(); resolve(); }, ms);
    function onAbort() {
      cleanup();
      const err = new Error('AbortError'); err.name = 'AbortError';
      reject(err);
    }
    function cleanup() {
      clearTimeout(t);
      signal?.removeEventListener('abort', onAbort);
    }
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}
