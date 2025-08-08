**fs-path.md**

# Filesystem (`fs`) & Path (`path`)

## 📌 What & why

- **`fs`**: Node’s filesystem API. Use async (callbacks), **promise** (`fs/promises`), or sync variants. Prefer **`fs/promises`** in app code.
- **`path`**: Cross-platform path utilities (`join`, `resolve`, `basename`, etc.). Never build paths with string concatenation.

------

## Imports & ESM gotchas

```js
// CommonJS
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

// ESM
import fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import path from 'node:path';

// ESM __dirname/__filename replacement:
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

------

## `path` essentials (cross-platform)

```js
path.join(...segments)        // Cleanly join segments, normalizes separators
path.resolve(...segments)     // Absolute path from cwd
path.basename(p, ext?)        // Last part; ext to strip (e.g., '.txt')
path.dirname(p)               // Parent directory
path.extname(p)               // '.txt'
path.normalize(p)             // Resolve '..' and '.' segments
path.isAbsolute(p)            // Boolean
path.parse(p) / path.format() // Object <-> string roundtrip
path.posix / path.win32       // Force style if needed
```

**Tip:** sanitize user input with `path.basename` + `path.normalize` to avoid `../../` traversal.

------

## Core `fs/promises` APIs (most used)

### Read a file

```js
// fsp.readFile(path, options?)
const txt = await fsp.readFile('/etc/hosts', { encoding: 'utf8' });
// options.encoding: 'utf8' | null (Buffer); options.signal?: AbortSignal
```

### Write / overwrite a file

```js
// fsp.writeFile(file, data, options?)
await fsp.writeFile('out.json', JSON.stringify(obj), {
  encoding: 'utf8',
  mode: 0o600,       // file perms if created
  flag: 'w'          // 'w' overwrite, 'wx' fail if exists
});
```

### Append

```js
await fsp.appendFile('app.log', line + '\n', { encoding: 'utf8', mode: 0o644, flag: 'a' });
```

### Make directory (mkdir -p)

```js
await fsp.mkdir('var/log/myapp', { recursive: true, mode: 0o755 });
```

### List directory

```js
// fsp.readdir(path, { withFileTypes: true })
const entries = await fsp.readdir('data', { withFileTypes: true });
for (const e of entries) {
  if (e.isDirectory()) { /* ... */ }
  if (e.isFile()) { /* ... */ }
}
```

### Stat / lstat

```js
const s = await fsp.stat('file');   // follows symlinks
// await fsp.lstat('link');         // does not follow symlinks
s.isFile(); s.isDirectory(); s.size; s.mtime;
```

### Copy / move / delete

```js
await fsp.copyFile('a.txt', 'b.txt');                               // COPYFILE_FICLONE on some platforms
await fsp.rename('b.txt', 'archive/b.txt');                          // move/rename
await fsp.rm('tmp', { recursive: true, force: true, maxRetries: 3 }); // remove file/dir
```

### File flags (common)

- `'r'` read, `'r+'` read/write
- `'w'` truncate or create, `'wx'` like w but **fail if exists**
- `'a'` append, `'ax'` append but fail if exists

------

## Streams (for large files & backpressure)

### Read & write streams

```js
const rs = fs.createReadStream('big.csv', { highWaterMark: 64 * 1024, encoding: 'utf8' });
const ws = fs.createWriteStream('out.csv',   { flags: 'w' });

rs.pipe(ws);             // handles backpressure automatically
ws.on('finish', () => console.log('done'));
```

### Line-by-line processing (realistic ETL)

```js
import fs from 'node:fs';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: fs.createReadStream('big.csv', { encoding: 'utf8' }),
  crlfDelay: Infinity
});

for await (const line of rl) {
  // parse & process line
}
```

**Stream options:**

- `highWaterMark` (buffer size), `start`/`end` (byte range), `encoding`, `flags`.

------

## Real-world snippets

### 1) Safe upload path (prevent traversal)

```js
function safeUploadPath(uploadDir, userFilename) {
  const base = path.basename(userFilename);                 // drop directories
  const final = path.join(uploadDir, base);
  if (!final.startsWith(path.resolve(uploadDir) + path.sep)) {
    throw new Error('Unsafe path');
  }
  return final;
}
```

### 2) Ensure dir, then atomic-ish write

```js
import { randomUUID } from 'node:crypto';

async function safeWriteJSON(dir, name, data) {
  await fsp.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, '.' + name + '.' + randomUUID() + '.tmp');
  await fsp.writeFile(tmp, JSON.stringify(data), { encoding: 'utf8', mode: 0o600 });
  await fsp.rename(tmp, path.join(dir, name)); // rename is atomic on same device
}
```

### 3) List only `.json` files with stats

```js
const dir = 'configs';
const entries = await fsp.readdir(dir, { withFileTypes: true });
const files = entries
  .filter(e => e.isFile() && path.extname(e.name) === '.json')
  .map(e => path.join(dir, e.name));

const stats = await Promise.all(files.map(f => fsp.stat(f)));
const bySize = files
  .map((f, i) => ({ file: f, size: stats[i].size }))
  .sort((a, b) => b.size - a.size);
```

### 4) Open a file descriptor (advanced I/O)

```js
const fh = await fsp.open('data.bin', 'r+');    // returns FileHandle
try {
  const { bytesRead, buffer } = await fh.read(Buffer.alloc(1024), 0, 1024, 0);
  // ... mutate buffer ...
  await fh.write(buffer, 0, bytesRead, 0);
} finally {
  await fh.close();
}
```

### 5) Config path relative to current module (ESM)

```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'config', 'app.json');
```

------

## Watchers (note)

- `fs.watch` is lightweight but platform-dependent; can miss events on heavy loads.
- For robust watching (dev tooling), use **chokidar**.

------

## ✅ Interview Tips

- Prefer **`fs/promises`**; know the sync/async variants exist.
- Explain **why `path.join` over string concat** (cross-platform, safety).
- Mention **atomic rename** pattern and **directory traversal** prevention.
- Know basic **flags** (`w`, `wx`, `a`) and **`readdir({ withFileTypes: true })`**.

------

Next: **url-and-querystring.md** (modern `URL`, `URLSearchParams`, file URLs, and replacing `querystring`).