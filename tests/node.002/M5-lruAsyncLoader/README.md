# M5 — `lruAsyncLoader(max, loader)`

Goal: LRU cache around an async `loader(key)` with in-flight dedupe.
- `get(key)` returns Promise of value.
- On rejection: do not cache error.
- Provide `size`, `has(key)`, `peek(key)`.
