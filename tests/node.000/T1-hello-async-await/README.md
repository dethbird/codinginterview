# T1 — Async/Await Warmup: `sleep(ms)` + ticks

Goal: Implement a non-blocking `sleep(ms)` using Promises and use it to print:
tick 1..5 with ~200ms between lines.

Steps
1) Implement `sleep(ms)` with Promise + setTimeout.
2) In an async function, loop i=1..5, await sleep(200), console.log('tick', i).
3) If ms<=0, resolve immediately.

Stretch: Add AbortSignal support.
