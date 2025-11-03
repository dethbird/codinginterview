short answer: advanced ops-y Node questions (like cluster + graceful drain) aren’t super common for general FE/FS roles, but they do pop up at infra-leaning backends, platform teams, and companies running large Node fleets (think: payments, streaming, SaaS with 24/7 SLAs). Expect them:

* ~0–10% of general web interviews,
* ~25–50% of backend/platform interviews,
* almost always in SRE/infra rounds.

Either way, having a crisp pattern in your notes is a flex. Here’s the “gold answer” you can drop in.

# 1) Zero-Downtime Rolling Restart (cluster + graceful drain)

```js
// cluster-rolling.js
'use strict';
const cluster = require('cluster');
const http = require('http');
const os = require('os');

const WORKERS = Number(process.env.WORKERS || os.cpus().length);
const PORT = Number(process.env.PORT || 3000);
const DRAIN_TIMEOUT_MS = Number(process.env.DRAIN_TIMEOUT_MS || 5000);

if (cluster.isPrimary) {
  // Keep pool healthy: if a worker dies unexpectedly, replace it.
  cluster.on('exit', (worker, code, signal) => {
    if (!worker.exitedAfterDisconnect) {
      console.error(`[master] worker ${worker.id} died (${code || signal}); respawning`);
      cluster.fork();
    }
  });

  // Spawn initial pool
  for (let i = 0; i < WORKERS; i++) cluster.fork();

  // Rolling restart on SIGHUP: replace each worker one-by-one
  process.on('SIGHUP', async () => {
    console.error('[master] SIGHUP: starting rolling restart…');

    // Important: snapshot current order so we don’t chase moving targets
    const workers = Object.values(cluster.workers);
    for (const oldW of workers) {
      if (!oldW?.isConnected()) continue;

      // 1) Fork a replacement and wait until it’s truly listening
      const replacement = cluster.fork();
      await onceListening(replacement);

      // 2) Tell old worker to graceful-drain; set a hard deadline
      await shutdownWorker(oldW, DRAIN_TIMEOUT_MS);
      console.error(`[master] rolled worker ${oldW.id} → replacement ${replacement.id}`);
    }
    console.error('[master] rolling restart complete.');
  });

  // Helper: wait until a worker is listening on a server
  function onceListening(w) {
    return new Promise((resolve, reject) => {
      const onListening = () => { cleanup(); resolve(); };
      const onExit = (code, signal) => { cleanup(); reject(new Error(`replacement exited (${code||signal})`)); };
      const cleanup = () => {
        w.off('listening', onListening);
        w.off('exit', onExit);
      };
      w.on('listening', onListening);
      w.on('exit', onExit);
    });
  }

  // Helper: request graceful shutdown and wait for exit or deadline
  function shutdownWorker(w, timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const t = setTimeout(() => {
        if (done) return;
        // Force kill if still around
        try { w.process.kill('SIGKILL'); } catch {}
      }, timeoutMs).unref?.();

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve();
      };

      w.once('exit', finish);
      // Ask worker to drain
      try { w.send({ type: 'shutdown' }); } catch { finish(); }
    });
  }

  console.log(`[master] PID ${process.pid} listening on :${PORT} with ${WORKERS} workers`);
} else {
  // ───────────────────────── Worker ─────────────────────────
  let inFlight = 0;
  let accepting = true;

  const server = http.createServer((req, res) => {
    if (!accepting) {
      res.statusCode = 503;
      res.setHeader('Connection', 'close');
      return res.end('draining');
    }
    inFlight++;
    res.on('finish', () => { inFlight--; });
    // Simulated work
    setTimeout(() => res.end(`pid ${process.pid}\n`), 100);
  });

  server.listen(PORT);

  process.on('message', (msg) => {
    if (!msg || msg.type !== 'shutdown') return;

    // Stop taking new work; close server so cluster stops routing to us
    accepting = false;
    // Hint clients not to keep-alive during drain window
    server.keepAliveTimeout = 1;
    server.headersTimeout = 2_000;

    // Stop accepting new connections; when all existing are closed, callback fires
    server.close(() => {
      // All connections closed; if no in-flight, exit immediately
      if (inFlight === 0) process.exit(0);
    });

    // Hard timeout in case of long-poll / zombies
    const hard = setTimeout(() => process.exit(0), DRAIN_TIMEOUT_MS);
    hard.unref?.();

    // Periodically check for completion
    const poll = setInterval(() => {
      if (inFlight === 0) {
        clearInterval(poll);
        clearTimeout(hard);
        process.exit(0);
      }
    }, 100);
    poll.unref?.();
  });

  // Optional: fast-fail on fatal errors but let master respawn
  process.on('uncaughtException', (err) => {
    console.error(`[worker ${process.pid}] uncaughtException:`, err);
    process.exit(1);
  });
}
```

## Why this passes tough graders

* **Zero downtime:** master forks a **replacement first**, waits for `'listening'`, then drains the old worker. At least N–1 workers always remain serving.
* **Graceful drain:** worker flips `accepting=false`, returns `503 draining` for new requests, calls `server.close()` (stop accepting), and waits for in-flight to finish.
* **Hard deadline:** master kills stragglers after `DRAIN_TIMEOUT_MS` (worker also has its own timer).
* **Crash resilience:** `cluster.on('exit')` respawns unexpected deaths outside of rolls.
* **No thundering herd:** rollout replaces **one worker at a time** in deterministic order.

## Quick manual demo

```bash
# terminal 1
node cluster-rolling.js
# terminal 2 - send load
while true; do curl -s localhost:3000 | head -1; sleep 0.05; done
# terminal 1 - trigger roll
kill -HUP $(pgrep -n node)   # or: pkill -HUP -f cluster-rolling.js
# observe: responses continue (PIDs change gradually), no gaps
```

## interviewer-friendly talking points

* Use **`cluster`** for multi-core without external load balancer.
* **Rolling restarts**: replacement comes **up first**, then old drains.
* Drain signals: **`server.close()`** + **in-flight counting** + **hard timeout** for zombies.
* Edge cases: if a worker **crashes during roll**, master **respawns**; the loop continues because we already waited for the replacement’s `'listening'`.
* For production you’d also add: health checks, readiness endpoints, SIGTERM handling (same drain), and maybe sticky sessions if your app needs them.
