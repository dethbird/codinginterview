**file-uploads-busboy-multer.md**

# File Uploads (Busboy & Multer)

## 📌 What & why

Handling uploads safely means **streaming** (not buffering), **validation** (size/type/count), and **secure storage** (no path traversal, no overwrites).
 Two common approaches:

- **Busboy** (lower-level, fast, streaming control).
- **Multer** (Express middleware, easier ergonomics).

Use **Busboy** when you want full streaming control (to disk/S3, virus scan). Use **Multer** for quick form uploads with sane limits.

------

## 🧰 Install

```bash
npm i busboy
npm i multer
# Optional helpers:
npm i file-type            # sniff file type from magic bytes
npm i @aws-sdk/client-s3 @aws-sdk/lib-storage  # S3 streaming
```

------

## Busboy (streaming, fine-grained control)

### Core API (args & events)

```js
import busboy from 'busboy';

const bb = busboy({
  headers: req.headers,               // REQUIRED: pass request headers
  limits: {
    files: 1,                         // max files
    fileSize: 5 * 1024 * 1024,        // per-file cap (bytes)
    fields: 10,                       // non-file fields
    parts: 20,                        // fields + files
  }
});
req.pipe(bb);

bb.on('file', (fieldname, fileStream, info) => {
  const { filename, mimeType, encoding } = info;
  // ...
});

bb.on('field', (name, val, info) => { /* text fields */ });
bb.on('limits', () => { /* hit a limit (e.g., fileSize) */ });
bb.on('error', (err) => { /* parse error */ });
bb.on('close', () => { /* all parts parsed */ });
```

**Notes**

- `fileStream` is a **Readable** — stream it to disk/S3; don’t `Buffer.concat`.
- On client disconnect: `req.on('close', () => bb.destroy(new Error('client closed')))`.

### Real-world: save to disk (atomic, validated)

```js
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';
import busboy from 'busboy';
import { fileTypeFromStream } from 'file-type'; // optional

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

app.post('/upload', (req, res, next) => {
  const bb = busboy({
    headers: req.headers,
    limits: { files: 1, fileSize: 5 * 1024 * 1024, fields: 5 }
  });

  let savedPath, originalName;

  req.pipe(bb);

  req.on('close', () => bb.destroy(new Error('client_disconnected')));

  bb.on('file', async (field, stream, info) => {
    try {
      originalName = info.filename ?? 'file';
      const ext = path.extname(originalName).toLowerCase().slice(0, 10); // tame ext
      const safeName = crypto.randomUUID() + ext;

      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
      const tmp = path.join(UPLOAD_DIR, `.${safeName}.tmp`);
      const dest = path.join(UPLOAD_DIR, safeName);

      // Optional: sniff magic bytes (prevents spoofed mime)
      const typedStream = stream; // fileTypeFromStream consumes the stream safely
      const ft = await fileTypeFromStream(typedStream).catch(() => null);
      const okType = ft ? ['image/png','image/jpeg','application/pdf'].includes(ft.mime) : true;
      if (!okType) { stream.destroy(new Error('unsupported_type')); return; }

      await pipeline(typedStream, fs.createWriteStream(tmp, { flags: 'wx', mode: 0o600 }));
      await fs.promises.rename(tmp, dest); // atomic move
      savedPath = dest;
    } catch (e) {
      stream.destroy(e);
    }
  });

  bb.on('field', (name, value) => {
    // validate small text fields here (title, tags…)
  });

  bb.on('error', (e) => next(e));
  bb.on('close', () => {
    if (!savedPath) return res.status(400).json({ error: 'no_file' });
    res.status(201).json({ ok: true, file: path.basename(savedPath), originalName });
  });
});
```

### Real-world: stream directly to S3 (no disk)

```js
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
const s3 = new S3Client({ region: process.env.AWS_REGION });

app.post('/upload-to-s3', (req, res, next) => {
  const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: 10 * 1024 * 1024 } });
  let key;

  req.pipe(bb);
  req.on('close', () => bb.destroy(new Error('client_disconnected')));

  bb.on('file', async (_field, file, info) => {
    try {
      key = `${crypto.randomUUID()}${path.extname(info.filename || '')}`;
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.BUCKET,
          Key: key,
          Body: file,                              // Readable stream
          ContentType: info.mimeType || 'application/octet-stream'
        }
      });
      await upload.done();
    } catch (e) {
      file.destroy(e);
    }
  });

  bb.on('error', next);
  bb.on('close', () => key ? res.status(201).json({ key }) : res.status(400).json({ error: 'no_file' }));
});
```

**Why Busboy:** You get streaming, strict limits, early abort on oversize, and the flexibility to route the stream anywhere.

------

## Multer (Express middleware, quick setup)

### Basics & parameters

```js
import multer from 'multer';

// Storage engines:
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),        // create dir ahead of time
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase())
});

// fileFilter(file, cb): accept/reject by mime/filename
const fileFilter = (req, file, cb) => {
  const ok = ['image/png','image/jpeg','application/pdf'].includes(file.mimetype);
  cb(null, ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,   // bytes
    files: 1,
    fields: 5
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  // req.file => { fieldname, originalname, mimetype, size, filename, path, ... }
  // req.body => other form fields
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.status(201).json({ file: path.basename(req.file.path) });
});
```

**API flavors**

- `upload.single('field')` – one file.
- `upload.array('field', maxCount)` – multiple same-field files.
- `upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'docs', maxCount: 5 }])` – mixed.
- `storage`: `diskStorage` or `memoryStorage` (⚠️ memory: OOM risk; only for small/ephemeral processing).

**Notes**

- Multer buffers a bit but writes to disk by default; for **S3 streaming**, prefer Busboy or use Multer-S3 storage engines.
- `file.mimetype` comes from the client; verify with magic bytes for security-critical flows.

------

## Validation & security checklist (copy/paste into your notes)

- ✅ **Limits**: `fileSize`, `files`, `fields`, and total `parts`.
- ✅ **Type check**: verify **magic bytes** (e.g., with `file-type`), not just extension/mimetype.
- ✅ **Safe filenames**: generate your own (UUID), keep only a **sanitized** extension; never trust `originalname`.
- ✅ **Directory traversal**: use `path.basename`, write inside a fixed directory.
- ✅ **No overwrite**: `flags: 'wx'`, atomic temp `rename`.
- ✅ **Backpressure**: always **stream** (Busboy / pipeline). Avoid accumulating buffers.
- ✅ **Client disconnect**: abort pipelines on `req.on('close', ...)`.
- ✅ **Virus scanning** (if required): stream to a scanner (e.g., ClamAV TCP) before persisting or before marking “ready”.
- ✅ **Auth & authorization**: uploads should require auth; store owner IDs alongside file metadata.
- ✅ **Cleanup**: on error, `unlink` any temp files.

------

## Optional: quick virus-scan hook (ClamAV-like TCP)

```js
// Pseudo-code: stream upload → scanner socket → only then save
import net from 'node:net';

function clamScanStream(stream) {
  return new Promise((res, rej) => {
    const sock = net.connect(3310, 'clamav'); // example host/port
    stream.pipe(sock);
    sock.once('data', (d) => /OK$/.test(String(d)) ? res(true) : rej(new Error('infected')));
    sock.once('error', rej);
  });
}
```

> Real integrations vary; most scanners accept streams and return status lines.

------

## Handling `Expect: 100-continue` (big uploads, nicer UX)

Express/Node can decide early:

```js
server.on('checkContinue', (req, res) => {
  // validate headers (auth/content-type) first:
  if ((req.headers['content-type'] || '').startsWith('multipart/form-data')) {
    res.writeContinue();
    app(req, res); // hand over to Express which runs Multer/Busboy
  } else {
    res.writeHead(415).end();
  }
});
```

------

## ✅ Interview Tips

- Explain why **streaming** matters (memory, large files, backpressure).
- Contrast **Multer** vs **Busboy**: ease vs control.
- Call out **limits**, **magic-byte validation**, **safe filenames**, **atomic write**.
- Mention **client disconnect** handling and **S3 streaming** without temp disk.
- Bonus: discuss **virus scanning** and **content moderation** pipelines.

------

Next: **06-databases/postgres-pg.md** or do you want to finish the remaining Express/API topics first?