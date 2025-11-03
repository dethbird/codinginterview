✅ **Verdict:** Good start — you close the server and exit on signal.
⚠️ Missing a few “graceful” pieces the test is likely looking for:

* **Hard timeout fallback** (in case connections hang).
* **Stop/finish existing keep-alive sockets** (end, then destroy after timeout).
* **Idempotent shutdown** (ignore repeated signals).
* Optional but nice: set `process.exitCode` instead of calling `process.exit` inside callbacks.

---

# 💎 Gold answer (for notes)

```js
// graceful.js
'use strict';
const http = require('http');

const server = http.createServer((req, res) => {
  // Hint client to not keep the connection around during shutdown
  res.setHeader('Connection', 'close');
  res.end('ok');
});

// Track open sockets so we can end/destroy them on shutdown
const sockets = new Set();

/** When a TCP connection is established */
server.on('connection', (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});

server.listen(3000, () => console.log('up'));

let shuttingDown = false;
const HARD_TIMEOUT_MS = 5000;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.error(`Received ${signal}. Shutting down...`);

  // Stop accepting new connections; existing will be allowed to finish
  server.close((err) => {
    if (err) {
      console.error('Error during server.close:', err);
      process.exit(1);
      return;
    }
    console.error('HTTP server closed cleanly.');
    // Prefer exitCode over process.exit if nothing else keeps the event loop alive
    process.exit(0);
  });

  // Politely tell open sockets to finish, then force-close later
  sockets.forEach((s) => {
    try {
      s.end(); // half-close; lets in-flight response finish if possible
    } catch {}
  });

  // Hard timeout: anything still open gets destroyed
  const t = setTimeout(() => {
    console.error(`Forcing shutdown after ${HARD_TIMEOUT_MS}ms; destroying ${sockets.size} socket(s).`);
    sockets.forEach((s) => {
      try {
        s.destroy();
      } catch {}
    });
  }, HARD_TIMEOUT_MS);

  // Don’t keep the process alive just for this timer
  t.unref?.();
}

// Handle signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// (Optional) escalate on unexpected errors
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
  shutdown('unhandledRejection');
});
```

---

## What you got right

* ✅ Calls `server.close()` and exits on callback.
* ✅ Uses signal handlers for `SIGINT`/`SIGTERM`.

## What was missing / improved

* ⏱️ **Hard timeout fallback** to avoid hanging forever.
* 🔌 **Connection tracking** to end/destroy sockets gracefully.
* 🔁 **Idempotency** so multiple signals don’t run shutdown twice.
* 🧹 Optional: `res.setHeader('Connection','close')` helps clients not keep-alive.

---

## 🧪 Tiny test ideas

1. **Signal path closes server**

```js
import assert from 'node:assert/strict';
import http from 'node:http';

let closed = false;
server.on('close', () => (closed = true));
process.kill(process.pid, 'SIGTERM');
setTimeout(() => assert.ok(closed), 1000);
```

2. **Hard-timeout destroys hanging connections**
   Create a handler that never ends response, fire `SIGINT`, assert process exits within ~5–6s.

---

### 🧠 Takeaway

“Graceful” = stop accepting new work, let in-flight finish, then **force** close with a deadline. Tracking sockets + a hard timeout gives you predictable shutdowns in prod.
