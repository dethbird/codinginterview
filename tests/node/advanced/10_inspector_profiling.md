# 10) Heap/CPU Profiling via Inspector

**Goal:** Programmatically capture a CPU profile and heap snapshot around `await work()`.

### 💎 Gold answer (`profile-capture.js`)
```js
'use strict';
const inspector = require('inspector');
const fs = require('fs');
const path = require('path');

async function profile(work, {
  cpuPath = 'profile.cpuprofile',
  heapPath = 'heap.heapsnapshot'
} = {}) {
  const session = new inspector.Session();
  session.connect();

  const post = (method, params={}) => new Promise((resolve, reject) => {
    session.post(method, params, (err, res) => err ? reject(err) : resolve(res));
  });

  try {
    // CPU profile
    await post('Profiler.enable');
    await post('Profiler.start');
    await Promise.resolve(work());
    const { profile } = await post('Profiler.stop');
    fs.writeFileSync(cpuPath, JSON.stringify(profile));
    // Heap snapshot
    await post('HeapProfiler.enable');
    const chunks = [];
    session.on('HeapProfiler.addHeapSnapshotChunk', ({ params }) => {
      chunks.push(params.chunk);
    });
    await post('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
    fs.writeFileSync(heapPath, chunks.join(''));
  } finally {
    session.disconnect();
  }
}

module.exports = { profile };

// demo
if (require.main === module) {
  const busy = async () => {
    const t = Date.now() + 250;
    while (Date.now() < t) Math.sqrt(Math.random());
    await new Promise(r => setTimeout(r, 50));
  };
  profile(busy, { cpuPath: 'demo.cpuprofile', heapPath: 'demo.heapsnapshot' })
    .then(() => console.log('Wrote demo.cpuprofile & demo.heapsnapshot'))
    .catch(err => console.error(err));
}
```

### Notes
- Write files can be large → ensure disk space.
- Always `disconnect()` the session (finally block).
