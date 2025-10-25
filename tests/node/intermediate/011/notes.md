✅ **Verdict:** Good start — you’re tracking `inFlight`, listening on `finish`, calling `server.close()`, and enforcing a 5s deadline.
⚠️ What’s missing for truly “graceful” in prod (and likely what tests poke at):

* **Idempotent shutdown** (ignore repeated signals).
* **Stop keep-alives** (`Connection: close`) so clients don’t hold sockets open.
* **Track sockets** and **destroy them at the deadline** (long-polls, stuck clients).
* Optionally **use `server.getConnections`** to report open sockets.
* **Interval `unref()`** so the timer doesn’t keep the process alive.

---

# 💎 Gold answer (for notes)

```js
// graceful-inflight.js
'use strict';
const http = require('http');

let inFlight = 0;
const sockets = new Set();
let shuttingDown = false;

const server = http.createServer((req, res) => {
  // Encourage client to drop keep-alive during shutdown windows
  res.setHeader('Connection', 'close');

  inFlight++;
  res.on('finish', () => { inFlight--; });

  // pretend async work
  setTimeout(() => res.end('ok'), 100);
});

// Track sockets so we can destroy them at the deadline if needed
server.on('connection', (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});

server.listen(3000, () => console.log('listening on :3000'));

function drainAndExit(signal) {
  if (shuttingDown) return; // idempotent
  shuttingDown = true;

  const HARD_TIMEOUT_MS = 5000;
  const start = Date.now();
  console.error(`${signal} received: draining...`);

  // Stop accepting new connections; keep existing until they finish
  server.close((err) => {
    if (err) console.error('server.close error:', err);
    console.error('Closed server listener.');
  });

  // Optionally log current open connections
  if (server.getConnections) {
    server.getConnections((err, count) => {
      if (!err) console.error(`Open connections: ${count}`);
    });
  }

  // Poll until drained or deadline, then force close remaining sockets
  const checker = setInterval(() => {
    const elapsed = Date.now() - start;

    if (inFlight === 0) {
      clearInterval(checker);
      console.error('All in-flight requests completed. Exiting 0.');
      process.exit(0);
    }

    if (elapsed >= HARD_TIMEOUT_MS) {
      clearInterval(checker);
      console.error('Deadline reached. Destroying lingering sockets...');
      for (const s of sockets) {
        try { s.destroy(); } catch {}
      }
      // Give destroyed sockets a beat to close buffers, then exit.
      setTimeout(() => process.exit(0), 50).unref?.();
    }
  }, 100);
  checker.unref?.();
}

process.on('SIGTERM', () => drainAndExit('SIGTERM'));
process.on('SIGINT',  () => drainAndExit('SIGINT')); // Ctrl+C convenience

// (Optional) escalate on fatal errors
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  drainAndExit('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
  drainAndExit('unhandledRejection');
});
```

---

## What you got right

* ✅ `inFlight` counter via `finish`.
* ✅ `server.close()` to stop accepting new connections.
* ✅ 5s deadline loop then exit.

## What we added / fixed

* 🔁 **Idempotency** (`shuttingDown` flag).
* 🔌 **Socket tracking** (`connection` set) + **forced destroy** at deadline.
* 📴 **`Connection: close`** to prevent lingering keep-alives.
* 📊 Optional **`getConnections`** log.
* 🧹 **`unref()`** on timers to avoid keeping the loop alive.

---

### 🧪 Tiny test ideas

1. **Drains before deadline**

```bash
node graceful-inflight.js &
PID=$!
ab -n 20 -c 5 http://127.0.0.1:3000/ &   # or autocannon
sleep 0.3
kill -TERM $PID                          # trigger graceful
# Expect: completes without 5s hang, exits 0
```

2. **Forces after deadline**
   Modify handler to `setTimeout(..., 10000)`; send a request; `SIGTERM`; observe sockets destroyed after ~5s.

---

### Takeaway

Graceful = stop accepting, let in-flight finish, then **forcefully** clean up at a deadline. Tracking sockets + setting `Connection: close` makes shutdowns predictable under keep-alive and long-poll traffic.
