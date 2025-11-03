# T6 — Retry Wrapper around fetch

Goal: Implement `retry(fn, { retries, delayMs })` and use it for fetch(url).
Retry only on 5xx or network errors.

Try:
node index.js https://httpstat.us/503?sleep=200
node index.js https://jsonplaceholder.typicode.com/todos/1
