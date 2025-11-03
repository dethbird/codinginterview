export function lruAsyncLoader(max, loader) {
  const cache = new Map(); // key -> { value }
  const inflight = new Map(); // key -> Promise
  function bump(key) {
    if (!cache.has(key)) return;
    const v = cache.get(key);
    cache.delete(key); cache.set(key, v);
  }
  async function load(key) {
    if (inflight.has(key)) return inflight.get(key);
    const p = Promise.resolve().then(() => loader(key)).then(val => {
      inflight.delete(key);
      cache.set(key, { value: val });
      if (cache.size > max) cache.delete(cache.keys().next().value);
      return val;
    }, err => { inflight.delete(key); throw err; });
    inflight.set(key, p);
    return p;
  }
  return {
    get(key) { if (cache.has(key)) { bump(key); return Promise.resolve(cache.get(key).value); } return load(key); },
    has(key) { return cache.has(key); },
    peek(key) { return cache.get(key)?.value; },
    get size() { return cache.size; }
  };
}
