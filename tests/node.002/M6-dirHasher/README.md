# M6 — `dir-hasher.js` (CLI)

Goal: `node dir-hasher.js <dir>` prints a deterministic SHA-256 of directory contents.
- Sorted relative path order.
- Skip `.git` and files > 5MB.
- Resolve symlinks; avoid cycles.
