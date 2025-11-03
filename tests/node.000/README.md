# Node for PHP Engineers — Starter Pack (6 Tasks)

A gentle ramp to get interview-ready in Node.js by mapping familiar PHP ideas to Node equivalents.
No tests here — each task has goals, hints, and a runnable scaffold.

## How to use
1) Ensure Node 18+ (has built-in `fetch` and `AbortController`).
2) `npm install`
3) Run a task:
   - `npm run start:t1`
   - `npm run start:t2` (uses `sample.txt`)
   - `npm run start:t3 <url>`
   - `npm run start:t4` (stdin -> stdout)
   - `npm run start:t5` (starts server on PORT)
   - `npm run start:t6 <url>`

## Concept bridge (PHP → Node)
- Blocking `sleep(1)` → non-blocking `await sleep(ms)` (Promise + setTimeout)
- `file_get_contents()` → `await fs.readFile()` or `await fetch(url)`
- `fopen`/`fgets` streams → Node `Readable`/`Writable`/`Transform`
- `$_SERVER` superglobals, middleware → Express `req`, `res`, `next()`
- cURL timeouts → `AbortController` with `fetch`
- Retry/backoff logic → same idea, but with `await` + timers

Work through T1 → T6 in order. Each step adds exactly one new Node building block.
