**abortcontroller-cancellation.md**

# AbortController & Cancellation in Node.js

## 📌 Definition

**AbortController** provides a standard way to **cancel async work**. You create a controller, pass its **`signal`** to APIs that support cancellation (e.g., `fetch`, `node:timers/promises`, many DB/HTTP libs), and call **`controller.abort(reason?)`** to stop them.

Why you care at work:

- Cancel slow upstream calls when the **client disconnects**.
- **Time out** requests without leaking resources.
- **Graceful shutdown**: abort in-flight work on `SIGTERM`/`SIGINT`.

------

## Core APIs & Parameters

- `new AbortController()` → `{ signal, abort(reason?) }`
- `controller.abort(reason?)` → sets `signal.aborted = true`, `signal.reason = reason`
- `signal.aborted` (boolean), `signal.reason` (any)
- `signal.addEventListener('abort', handler)`
- `signal.throwIfAborted()` → throws if already aborted
- `AbortSignal.timeout(ms)` → a signal that aborts after `ms` (handy for timeouts)

**Supported Node APIs (examples):**

- **Global `fetch`** (Node 18+): `{ signal }`
- **`node:timers/promises`**: `setTimeout(delay, value, { signal })`
- Some third-party libs (e.g., `undici`, `got`, Prisma/pg in certain flows) accept `{ signal }` too—check their docs.

------

## 🛠 Real-World Patterns & Snippets

### 1) Simple timeout for `fetch`

```js
const controller = new AbortController();
const t = setTimeout(() => controller.abort(new Error('HTTP timeout')), 2000);

try {
  const res = await fetch('https://api.example.com/data', { signal: controller.signal });
  clearTimeout(t);
  if (!res.ok) throw new Error(`Bad status: ${res.status}`);
  const json = await res.json();
  console.log(json);
} catch (err) {
  console.error('Request failed/canceled:', err);
}
```

### 2) Cleaner: `AbortSignal.timeout(ms)`

```js
const signal = AbortSignal.timeout(2000); // auto-abort after 2s
const res = await fetch('https://api.example.com/data', { signal });
```

### 3) Abortable sleep / backoff with `timers/promises`

```js
import { setTimeout as sleep } from 'node:timers/promises';

const ac = new AbortController();
setTimeout(() => ac.abort(new Error('Shutdown')), 500);

try {
  await sleep(5_000, undefined, { signal: ac.signal }); // cancels early
} catch (e) {
  console.log('Sleep aborted:', e.message);
}
```

### 4) Make **your own** abortable function

Accept `{ signal }`, check early, and unsubscribe on finish.

```js
export async function readWithCancel(fs, path, { signal } = {}) {
  signal?.throwIfAborted();

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason ?? new Error('Aborted'));
    signal?.addEventListener('abort', onAbort);

    fs.readFile(path, 'utf8', (err, data) => {
      signal?.removeEventListener('abort', onAbort);
      if (err) return reject(err);
      resolve(data);
    });
  });
}
```

### 5) Cancel **parallel** work (propagate one signal)

Pass the **same signal** to each task; abort once on the first failure/timeout.

```js
const ac = new AbortController();
const tasks = urls.map(u => fetch(u, { signal: ac.signal }).then(r => r.json()));

try {
  const results = await Promise.all(tasks);
  // ...
} catch (err) {
  ac.abort(err); // stop remaining in-flight requests
  // handle/log error...
}
```

### 6) Express: cancel long work if client disconnects

When the client drops, **stop upstream calls** to save resources.

```js
app.get('/report', async (req, res) => {
  const ac = new AbortController();
  const onClose = () => ac.abort(new Error('Client disconnected'));

  res.on('close', onClose);

  try {
    const data = await fetch(process.env.REPORT_URL, { signal: ac.signal }).then(r => r.json());
    if (!res.headersSent) res.json(data);
  } catch (e) {
    if (!res.headersSent) res.status(499).json({ error: e.message }); // 499: client closed request (nginx-style)
  } finally {
    res.off('close', onClose);
  }
});
```

### 7) Graceful shutdown (SIGTERM)

Stop taking new traffic, **abort in-flight**, then exit.

```js
const server = app.listen(process.env.PORT || 3000);
const ac = new AbortController();

process.on('SIGTERM', async () => {
  ac.abort(new Error('Shutting down'));
  server.close(err => {
    if (err) console.error('Server close error', err);
    // close DB, flush logs, etc.
    process.exit(0);
  });
});
```

### 8) Compose signals (race multiple)

Abort if **any** of several conditions fires.

```js
function anySignal(...signals) {
  const ac = new AbortController();
  const onAbort = (e) => ac.abort(e.target.reason);
  signals.forEach(s => s.addEventListener('abort', onAbort, { once: true }));
  return ac.signal;
}

// Usage:
const s = anySignal(AbortSignal.timeout(2000), shutdownController.signal);
await fetch(url, { signal: s });
```

------

## ✅ Interview Tips

- Explain **why cancellation saves resources** (upstream APIs, DB, CPU).
- Show **timeout + abort** without leaking timers.
- Demonstrate **propagating a signal** through layers (route → service → HTTP/DB).
- Mention **graceful shutdown** and **client disconnect** handling.

------

Ready for **03-core-modules/fs-path.md** next?