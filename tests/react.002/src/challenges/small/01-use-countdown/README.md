# Small 01 — useCountdown Hook
Implement `useCountdown({ from, intervalMs })` that returns `[value, start, stop, reset]`.

- `from` (number): starting value in seconds
- `intervalMs` (number): tick interval in ms (default 1000)
- `start()` begins ticking down; `stop()` pauses; `reset()` sets back to `from`
- When value reaches 0, it must stop at 0 (no negatives)

Bonus: call optional `onDone()` when it hits 0.
