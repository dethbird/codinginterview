# T2 — Count Lines: `node index.js <path>`

Goal: Read a file and print the count of newline-separated lines.
Handle CRLF, empty file, and missing file (print message, exit 1).

Steps
- Read `process.argv[2]` or print usage.
- `await fs.readFile(path, 'utf8')`, split on /\r?\n/.
- If the last element is empty due to trailing newline, subtract one.
