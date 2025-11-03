# M3 — `miniJobQueue({ concurrency, retries })`

Goal: FIFO job queue with concurrency, retries, and events: `start`, `success`, `failure`, `drain`.  
Expose `size`, `active`, `pending`, and `close()` to stop accepting and wait for drain.
