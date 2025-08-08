**child-process.md**

# Child Processes: `spawn`, `exec`, `execFile`, `fork`

## 📌 What & why

Use **child processes** to run other programs (ffmpeg, git, ImageMagick, grep), call legacy CLIs, or spin up **another Node process**. They give you:

- Isolation for CPU-heavy or crash-prone tasks
- Access to native tools
- Streaming I/O (don’t buffer huge outputs in memory)

> For *pure JS CPU-bound work*, prefer **Worker Threads**. For *external tools/CLIs*, use **child_process**.

------

## API overview (differences you’ll be asked about)

### `spawn(command, args?, options?)` → `ChildProcess`

- **Streams**: `child.stdout`, `child.stderr` (Readable), `child.stdin` (Writable)
- **No shell** by default → safer (no shell injection), **no glob expansion**
- Use when you want **streaming** I/O

### `exec(command, options?, callback)` → buffers whole output

- Runs via shell (`/bin/sh` or `cmd.exe`)
- **Buffers** stdout/stderr (default `maxBuffer` ≈ 1MB)
- Easy for short outputs, **dangerous for large ones** & injection-prone

### `execFile(file, args?, options?, callback)`

- Like `exec` but **no shell**; takes **args array** (safe)
- Still buffers output; good for short command results

### `fork(modulePath, args?, options?)` → Node-to-Node with IPC

- Spawns a **Node** process running a JS file
- Has an **IPC channel**: `child.send(msg)` / `child.on('message', …)`
- Use when you need **structured messages** between Node processes

> Sync variants `spawnSync`/`execSync` block the event loop — avoid in servers.

------

## Common `options` (all)

- `cwd`: working directory
- `env`: environment vars (defaults to `process.env`)
- `stdio`: `'pipe' | 'inherit' | 'ignore' | [stdin, stdout, stderr, 'ipc'?]`
- `shell`: `true | string` → spawn via shell (be careful)
- `windowsHide`: `true` to hide console on Windows
- `detached`: run in its own process group (see “kill tree” below)
- `signal`: `AbortSignal` (Node 15+) to **cancel** spawn/exec
- `timeout` (exec/execFile): kill after N ms (invokes callback with `killed: true`)
- `maxBuffer` (exec/execFile): change output buffer limit

------

## Events & properties

- `child.pid`
- `child.kill([signal='SIGTERM'])`
- Events: `'spawn'`, `'exit' (code, signal)`, `'close' (code, signal)`, `'error'`
- Streams: `child.stdout.on('data', ...)`, etc.

------

## ✅ Safe spawning (no shell, stream output)

```js
import { spawn } from 'node:child_process';

function runGit(args, { cwd, signal } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, signal }); // no shell
    let out = '', err = '';

    child.stdout.setEncoding('utf8').on('data', d => (out += d));
    child.stderr.setEncoding('utf8').on('data', d => (err += d));

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(Object.assign(new Error(`git ${args.join(' ')} failed (${code})`), { code, err }));
    });
  });
}

// Usage:
const list = await runGit(['status', '--porcelain'], { cwd: '/repo' });
```

- **Arguments are an array** → avoids shell-injection risks.
- Stream output; not memory-safe for *huge* outputs—pipe to a file if needed.

------

## ⏱️ Timeout & cancellation with `AbortController`

```js
import { spawn } from 'node:child_process';

export async function runWithTimeout(cmd, args, { ms = 5000, cwd } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(new Error('timeout')), ms);
  try {
    await new Promise((resolve, reject) => {
      const p = spawn(cmd, args, { cwd, signal: ac.signal });
      p.on('error', reject);
      p.on('close', (code, sig) => code === 0 ? resolve() : reject(new Error(`exit ${code ?? sig}`)));
    });
  } finally {
    clearTimeout(t);
  }
}
```

**Why:** Production-grade calls must not hang forever.

------

## 📦 `execFile` for short outputs (safe, buffered)

```js
import { execFile } from 'node:child_process';

const { stdout } = await new Promise((res, rej) => {
  execFile('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', 'video.mp4'],
    { timeout: 8000, maxBuffer: 10 * 1024 * 1024 }, // 10MB buffer
    (err, stdout, stderr) => err ? rej(err) : res({ stdout, stderr })
  );
});
const meta = JSON.parse(stdout);
```

- **No shell**, so flags are safe.
- Increase `maxBuffer` for moderately large JSON outputs.

------

## 📡 Piping between processes (streaming, backpressure-aware)

```js
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

// gzip a file: cat big.log | gzip > big.log.gz
const cat = spawn('cat', ['big.log']);             // or fs.createReadStream
const gz  = spawn('gzip', ['-9']);
const out = fs.createWriteStream('big.log.gz');

cat.stdout.pipe(gz.stdin);
await pipeline(gz.stdout, out);
```

- Prefer **`pipeline`** for at least the last leg to catch errors and close files.

------

## 🧠 `fork` — Node-to-Node with IPC (workers via processes)

```js
// parent.js
import { fork } from 'node:child_process';
const child = fork(new URL('./worker.js', import.meta.url), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

child.on('message', (msg) => console.log('result:', msg));
child.send({ type: 'compute', payload: 123 });

// worker.js
process.on('message', (msg) => {
  if (msg.type === 'compute') {
    const result = heavyCompute(msg.payload);
    process.send?.({ ok: true, result });
  }
});
```

- Use when you need **separate memory** (crash isolation) and **structured messages**.
- If sharing memory or lower overhead matters, consider **Worker Threads** instead.

------

## 🛡️ Security notes

- **Avoid `exec` with interpolated strings**. If you must use a shell, *carefully* quote args and validate inputs.
- Prefer **`spawn`/`execFile` with args array**.
- Restrict `cwd`, `PATH`, and command locations (e.g., full paths) in multi-tenant environments.

------

## 🪓 Killing processes & child trees

- `child.kill('SIGTERM')` → request graceful shutdown.
- On **Unix**, if you spawned with `{ detached: true }`, you can kill the **group**: `process.kill(-child.pid, 'SIGTERM')`.
- On **Windows**, signals are limited; consider the **`tree-kill`** package for cross-platform termination.
- Always handle `'close'` and `'error'` to avoid zombie processes.

```js
function killTree(child) {
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
}
```

------

## 🧪 Real-world examples

### 1) Generate a thumbnail with ffmpeg (streaming I/O)

```js
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

async function thumbnail(inPath, outPath) {
  const ff = spawn('ffmpeg', ['-y', '-i', inPath, '-frames:v', '1', '-vf', 'scale=320:-1', outPath]);
  return new Promise((res, rej) => {
    ff.on('error', rej);
    ff.on('close', (code) => code === 0 ? res() : rej(new Error('ffmpeg failed')));
  });
}
await thumbnail('video.mp4', 'thumb.jpg');
```

### 2) Grep logs and write CSV (pipe chain)

```js
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

const grep = spawn('grep', ['ERROR', '/var/log/app.log']);
await pipeline(grep.stdout, fs.createWriteStream('errors.log'));
```

> In Node-only envs, prefer streaming transforms; but calling ubiquitous tools is pragmatic in ops scripts.

### 3) Large output → don’t buffer

```js
const ps = spawn('some-tool', ['--dump']);
ps.stdout.pipe(fs.createWriteStream('dump.json')); // stream to disk
ps.on('close', (code) => { if (code !== 0) console.error('failed'); });
```

### 4) Per-request job with cancel on client disconnect

```js
app.get('/report', async (req, res) => {
  const ac = new AbortController();
  res.on('close', () => ac.abort(new Error('client disconnected')));

  try {
    const p = spawn('long-report', ['--format', 'json'], { signal: ac.signal });
    res.setHeader('content-type', 'application/json');
    await pipeline(p.stdout, res); // stream directly
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: String(e.message || e) });
  }
});
```

------

## Gotchas & best practices

- **`exec`/`execFile`** buffer output → set `maxBuffer` or switch to `spawn`.
- Always **listen for `'error'`** (spawn can fail if binary not found).
- **Inherit stdio** (`stdio: 'inherit'`) for dev to see output live.
- Set **`PATH`** explicitly in CI/containers when you rely on system tools.
- Consider **`execa`** for a nicer API (promise-based, sane defaults), but know the **core** APIs in interviews.

------

## ✅ Interview Tips

- Explain when to choose **`spawn` vs `exec` vs `execFile` vs `fork`**.
- Mention **streaming vs buffering** and **maxBuffer** pitfalls.
- Show **timeout/cancellation** with `AbortController`.
- Discuss **signal handling**, killing **process groups**, and Windows differences.
- Call out **security**: avoid shells; pass args as arrays; validate inputs.

------

Next: **04-files-and-streams/streaming-read-write.md** (practical read/write patterns beyond basics, partial reads, ranged requests, and atomic moves).