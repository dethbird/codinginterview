# 18) Pluggable Serializer Cache with WeakRef

**Goal:** Cache serialized strings tied to object liveness; rebuild on GC.

### 💎 Gold answer (`weakref-cache.js`)
```js
'use strict';

class SerializerCache {
  constructor(serializer) {
    this.serializer = serializer;
    this.map = new Map(); // key -> { ref: WeakRef(obj), ser: string }
    this.registry = new FinalizationRegistry((key) => {
      // object collected → drop cache entry
      this.map.delete(key);
    });
  }
  get(key, obj) {
    const rec = this.map.get(key);
    if (rec) {
      const val = rec.ref.deref();
      if (val) return rec.ser; // still valid
    }
    // (re)serialize
    const ser = this.serializer(obj);
    const ref = new WeakRef(obj);
    this.map.set(key, { ref, ser });
    this.registry.register(obj, key);
    return ser;
  }
}

module.exports = { SerializerCache };
```

### Notes
- The registry callback timing is non-deterministic; treat it as a best-effort cleanup.
- Do not store strong references to `obj` anywhere in the cache.
