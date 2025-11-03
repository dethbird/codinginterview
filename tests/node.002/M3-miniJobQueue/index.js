import { EventEmitter } from 'events';

let seq = 1;
export function miniJobQueue({ concurrency = 1, retries = 0 } = {}) {
  const ee = new EventEmitter();
  const q = [];
  const inflight = new Map(); // id -> { job, attemptsLeft }
  let accepting = true;

  function maybeRun() {
    while (inflight.size < concurrency && q.length > 0) {
      const item = q.shift();
      const { id, job } = item;
      inflight.set(id, { job, attemptsLeft: item.attemptsLeft });
      ee.emit('start', id);
      Promise.resolve()
        .then(() => job())
        .then(val => {
          inflight.delete(id);
          ee.emit('success', id, val);
          maybeRun();
          if (!accepting && inflight.size === 0 && q.length === 0) ee.emit('drain');
        })
        .catch(err => {
          const rec = inflight.get(id);
          inflight.delete(id);
          if (rec && rec.attemptsLeft > 0) {
            q.push({ id, job, attemptsLeft: rec.attemptsLeft - 1 });
            maybeRun();
          } else {
            ee.emit('failure', id, err);
            maybeRun();
            if (!accepting && inflight.size === 0 && q.length === 0) ee.emit('drain');
          }
        });
    }
  }

  return Object.assign(ee, {
    push(job) {
      if (!accepting) throw new Error('queue closed');
      const id = seq++;
      q.push({ id, job, attemptsLeft: retries });
      maybeRun();
      return id;
    },
    get size() { return q.length; },
    get active() { return inflight.size; },
    get pending() { return q.length; },
    async close() {
      accepting = false;
      if (inflight.size === 0 && q.length === 0) { ee.emit('drain'); return; }
      await new Promise(r => ee.once('drain', r));
    }
  });
}
