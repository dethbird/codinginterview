export function ttlCache({ defaultTtlMs = 1000, sweepIntervalMs = 0 } = {}) {
  const store = new Map(); // key -> { value, expires }
  let timer = null;
  function sweep() {
    const now = Date.now();
    for (const [k, v] of store) if (v.expires <= now) store.delete(k);
  }
  if (sweepIntervalMs > 0) {
    timer = setInterval(sweep, sweepIntervalMs);
    if (typeof timer.unref === 'function') timer.unref();
  }
  return {
    set(k, v, ttlMs = defaultTtlMs) { store.set(k, { value: v, expires: Date.now() + ttlMs }); return true; },
    get(k) {
      const e = store.get(k); if (!e) return undefined;
      if (e.expires <= Date.now()) { store.delete(k); return undefined; }
      return e.value;
    },
    has(k) { return this.get(k) !== undefined; },
    delete(k) { return store.delete(k); },
    get size() { sweep(); return store.size; },
    close() { if (timer) clearInterval(timer); }
  };
}
