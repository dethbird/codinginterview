**events-and-eventemitter.md**

# Events & `EventEmitter`

## 📌 What & why

`EventEmitter` implements the **publish/subscribe** pattern in Node. Objects emit **named events**; you attach **listeners** (callbacks) to react. It’s synchronous by default (handlers run immediately in the same tick), so be mindful of long-running listeners.

------

## Core API (arguments & behavior)

```js
import { EventEmitter } from 'node:events';
const bus = new EventEmitter();
```

- `bus.on(eventName, listener)` / `bus.addListener(eventName, listener)`
  - **eventName**: `string | symbol`
  - **listener**: `(...args: any[]) => void`
  - Returns `bus` (chainable).
- `bus.once(eventName, listener)` — auto-removes after first call.
- `bus.off(eventName, listener)` / `bus.removeListener(eventName, listener)`
- `bus.removeAllListeners(eventName?)`
- `bus.emit(eventName, ...args)` → **boolean** (whether any listeners were called).
- `bus.listenerCount(eventName)` / `bus.listeners(eventName)` / `bus.rawListeners(eventName)`
- `bus.eventNames()` → list of event names with listeners.
- `bus.setMaxListeners(n)` / `bus.getMaxListeners()` — default is **10**; exceeding warns about potential leaks.
- **Special**: the `'error'` event — if emitted **without** at least one listener, Node throws and may crash the process.

> Tip: If a listener does heavy CPU work, offload (e.g., `setImmediate` / Worker Threads) so you don’t block the loop.

------

## Realistic patterns & snippets

### 1) Minimal bus + error handling

```js
import { EventEmitter } from 'node:events';
const bus = new EventEmitter();
bus.setMaxListeners(50); // quiet “memory leak” warnings for legit many listeners

bus.on('error', (err) => {
  // central error log; never emit 'error' without this
  console.error('[bus error]', err);
});

bus.on('user:created', (user) => {
  // lightweight handler; offload anything heavy
  setImmediate(() => sendWelcomeEmail(user).catch(e => bus.emit('error', e)));
});

// Somewhere else:
bus.emit('user:created', { id: 123, email: 'a@b.com' });
```

### 2) Request-scoped emitter (per job) + cleanup

```js
function createImportJob() {
  const job = new EventEmitter();
  setImmediate(async () => {
    try {
      job.emit('start');
      for (const row of await readRows()) {
        job.emit('row', row);
      }
      job.emit('done', { count: 42 });
    } catch (err) {
      job.emit('error', err);
    }
  });
  return job;
}

// Usage:
const job = createImportJob();
const onRow = (r) => { /* update progress bar */ };
job.on('start', () => console.log('Import started'));
job.on('row', onRow);
job.once('done', (meta) => { job.off('row', onRow); console.log('Done', meta); });
job.on('error', (e) => { job.off('row', onRow); console.error(e); });
```

*Why:* Encapsulates a long operation with progress events; avoids global state and ensures **deterministic cleanup**.

### 3) Wait for an event with a **Promise**

```js
import { once } from 'node:events';
import http from 'node:http';

const server = http.createServer(app);
server.listen(0);
await once(server, 'listening'); // resolves when listening fires
console.log('Server on', server.address());
```

### 4) Async-iterate events (backpressure-friendly consumption)

```js
import { on } from 'node:events';

for await (const [row] of on(job, 'row')) {
  // Consume rows one-by-one; backpressure via await
}
```

### 5) Forward/bridge events

```js
function forward(src, dst, events) {
  const handlers = events.map((ev) => {
    const h = (...args) => dst.emit(ev, ...args);
    src.on(ev, h);
    return [ev, h];
  });
  return () => handlers.forEach(([ev, h]) => src.off(ev, h)); // unforward
}
```

### 6) Express + SSE progress using events

```js
app.get('/import', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const job = createImportJob();
  const send = (ev, data) => res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`);

  const stop = forward(job, { emit: send }, ['start', 'row', 'done', 'error']);

  res.on('close', () => { stop(); res.end(); }); // cleanup if client disconnects
});
```

### 7) Avoiding listener leaks (same function reference!)

```js
function onTick() {}
bus.on('tick', onTick);

// Later:
bus.off('tick', onTick); // OK
// bus.off('tick', () => {}) // ❌ won’t work — different function reference
```

### 8) Don’t block inside listeners

```js
bus.on('report', (payload) => {
  // ❌ heavy CPU here would block emitters everywhere
  setImmediate(() => generateReport(payload)); // ✅ yield to loop
});
```

------

## Gotchas & interview notes

- **`'error'` must be handled** or the process throws. Show this explicitly.
- `emit()` is **synchronous** — if one listener throws, subsequent listeners are **not** called unless you catch.
- Many listeners → **consider a queue/stream** instead of blasting events (events are unbounded; no backpressure).
- Use `.once()` for “ready/connected” semantics to avoid multiple inits.
- If you see **MaxListenersExceededWarning**, either `.setMaxListeners(n)` intentionally or rethink lifecycle (detach listeners on completion).

------

## TypeScript: strongly-typed events (lightweight pattern)

/** Map event name → listener signature */

```ts
type Events = {
  'user:created': (user: { id: number; email: string }) => void;
  'done': (meta: { count: number }) => void;
  'error': (err: Error) => void;
};

class TypedEmitter<E> extends EventEmitter {
  on<K extends keyof E>(event: K, listener: E[K]): this { return super.on(event as string, listener as any); }
  once<K extends keyof E>(event: K, listener: E[K]): this { return super.once(event as string, listener as any); }
  off<K extends keyof E>(event: K, listener: E[K]): this { return super.off(event as string, listener as any); }
  emit<K extends keyof E>(event: K, ...args: Parameters<E[K]>): boolean { return super.emit(event as string, ...args as any); }
}

const bus = new TypedEmitter<Events>();
bus.on('user:created', (u) => console.log(u.email));   // typed!
```

------

## ✅ Interview Tips

- Explain synchronous nature and `'error'` semantics.
- Show **cleanup** to prevent leaks (store references; `once`; `off` in `finally`).
- Mention **`events.once`** and **`events.on`** for promise/async-iter patterns.
- Know when to **not** use events (replace with streams/queues when you need backpressure or durability).

------

Next: **buffer-and-typedarrays.md** (binary data, `Buffer` vs `Uint8Array`, encoding pitfalls, and real-world file/network examples).