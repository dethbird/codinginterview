Awesome—here’s a lean, production-minded worker pool that **transfers** large `Uint8Array`s (zero-copy) to workers, mutates them in place, and transfers them back. It includes:

* a size-`N` idle queue dispatcher,
* **transfer lists** (`postMessage(value, [buf.buffer])`) both directions,
* simple **backpressure** via `maxQueue`,
* **crash recovery** (respawn workers and reject the in-flight job),
* graceful `close()`.

---

# 7) Worker Pool with Transferable Buffers

### `pool-transfer.js`

```js
// pool-transfer.js
'use strict';
const { Worker } = require('worker_threads');
const path = require('path');

class Pool {
  /**
   * @param {number} size number of workers (>=1)
   * @param {object} [opts]
   * @param {string} [opts.worker] path to worker file (default: ./worker.js)
   * @param {number} [opts.maxQueue=Infinity] max queued jobs before rejecting
   */
  constructor(size, opts = {}) {
    if (!Number.isInteger(size) || size < 1) throw new Error('Invalid pool size');
    this.size = size;
    this.maxQueue = opts.maxQueue ?? Infinity;
    this.workerPath = opts.worker || path.resolve(__dirname, 'worker.js');

    /** @type {Set<Worker>} */
    this.all = new Set();
    /** @type {Worker[]} */
    this.idle = [];
    /** @type {{id:number, resolve:Function, reject:Function, buf?:Uint8Array}[]} */
    this.queue = [];
    /** @type {Map<Worker, {id:number, resolve:Function, reject:Function}>} */
    this.inflight = new Map();

    this._nextId = 1;
    this._closing = false;

    for (let i = 0; i < size; i++) this._spawn();
  }

  _spawn() {
    const w = new Worker(this.workerPath);
    this.all.add(w);

    w.on('message', (msg) => {
      // msg: { id, buf } where buf is a Uint8Array (transferred back)
      const job = this.inflight.get(w);
      if (!job || job.id !== msg.id) {
        // Unknown or stale job; just ignore
        return;
      }
      this.inflight.delete(w);
      this.idle.push(w);
      this._drain();
      job.resolve(msg.buf); // <— Uint8Array whose buffer is now owned here
    });

    w.on('error', (err) => {
      const job = this.inflight.get(w);
      if (job) {
        this.inflight.delete(w);
        job.reject(err);
      }
      this._replace(w);
    });

    w.on('exit', (code) => {
      const job = this.inflight.get(w);
      if (job) {
        this.inflight.delete(w);
        job.reject(new Error(`Worker exited ${code}`));
      }
      this.all.delete(w);
      if (!this._closing) this._spawn(); // keep pool size
    });

    this.idle.push(w);
  }

  _replace(w) {
    try { w.terminate(); } catch {}
    this.all.delete(w);
    if (!this._closing) this._spawn();
    this._drain();
  }

  _assign(w, job) {
    this.inflight.set(w, job);
    // Transfer the ArrayBuffer ownership to worker (zero copy).
    // After this call, job.buf.buffer is neutered here—do not touch job.buf again.
    w.postMessage({ id: job.id, buf: job.buf }, [job.buf.buffer]);
    // Remove local ref to make it obvious we shouldn't use it
    delete job.buf;
  }

  _drain() {
    while (this.idle.length && this.queue.length) {
      const w = this.idle.shift();
      const job = this.queue.shift();
      if (!w) break;
      this._assign(w, job);
    }
  }

  /**
   * Submit a Uint8Array for processing.
   * Returns a Promise<Uint8Array> where the returned buffer ownership is transferred back to the main thread.
   */
  run(buf) {
    if (!(buf instanceof Uint8Array)) {
      return Promise.reject(new Error('Pool.run expects a Uint8Array'));
    }
    if (this._closing) return Promise.reject(new Error('Pool is closing'));
    if (this.queue.length >= this.maxQueue && this.idle.length === 0) {
      return Promise.reject(new Error('Backpressure: queue is full'));
    }

    const id = this._nextId++;
    return new Promise((resolve, reject) => {
      const job = { id, resolve, reject, buf };
      const w = this.idle.shift();
      if (w) {
        this._assign(w, job);
      } else {
        this.queue.push(job);
      }
    });
  }

  async close() {
    this._closing = true;
    // Wait until queue is empty and no inflight jobs
    await new Promise((r) => {
      const check = () => {
        if (this.queue.length === 0 && this.inflight.size === 0) return r();
        setTimeout(check, 10);
      };
      check();
    });
    await Promise.allSettled([...this.all].map((w) => w.terminate()));
    this.all.clear();
    this.idle.length = 0;
  }

  get pending() { return this.queue.length; }
  get active() { return this.inflight.size; }
}

module.exports = { Pool };
```

### `worker.js`

```js
// worker.js
'use strict';
const { parentPort } = require('worker_threads');

// Example transformation: XOR each byte with 0xFF (in-place)
function transform(buf) {
  // buf is Uint8Array with transferred ownership inside the worker
  for (let i = 0; i < buf.length; i++) {
    buf[i] = buf[i] ^ 0xFF;
  }
  return buf;
}

parentPort.on('message', ({ id, buf }) => {
  try {
    // Ensure buf is a Uint8Array (it will be, per our contract)
    const out = transform(buf);
    // Transfer the ArrayBuffer back to the main thread (zero copy)
    parentPort.postMessage({ id, buf: out }, [out.buffer]);
  } catch (err) {
    // Error path: post an error-like object or throw to trigger 'error' on the worker
    // Here we throw, letting the pool reject and respawn.
    throw err;
  }
});
```

---

## Usage example

```js
const { Pool } = require('./pool-transfer');

(async () => {
  const pool = new Pool(4, { maxQueue: 100 }); // 4 workers
  const input = new Uint8Array([0x00, 0xAA, 0xFF]);

  // After run(), `input.buffer` is neutered (transferred). Do not use `input` anymore.
  const out = await pool.run(input);
  console.log(out); // Uint8Array with bytes XOR'd with 0xFF => [0xFF, 0x55, 0x00]

  await pool.close();
})();
```

---

## Key points (interview-ready)

* **Transferables**: Pass `buf.buffer` in the transfer list to avoid copying. Ownership moves to the worker; accessing `buf` after `postMessage` will throw/behave as neutered. Always treat the returned `Uint8Array` as the **new** owner in the main thread.
* **Backpressure**: `maxQueue` bounds memory growth; reject early if callers outpace workers.
* **Crash recovery**: On `'error'`/non-zero `'exit'`, reject the inflight job and **respawn** to keep pool size constant.
* **Zero-copy both ways**: Transfer to worker, mutate in place, transfer back.
* **Safety**: Never touch the buffer after transferring; always send/receive `Uint8Array` (or a structured shape) not raw `ArrayBuffer` for convenience.
