# Event Loop

```
01-runtime-basics/event-loop.md
```

and work our way down, making each note interview-ready with:

- **Definition** — what it is and why it matters in Node.js
- **Parameter/argument notes** — for any relevant APIs
- **Real-world examples** — situations you’d likely see in a dev job, not just toy snippets

------

# `event-loop.md`

## 📌 Definition

The **Event Loop** is the core mechanism that allows Node.js to handle many operations concurrently without multiple threads.
 Node.js is **single-threaded** for JavaScript execution, but it uses **libuv** to manage an event queue, timers, I/O, and background tasks (like file reads and network requests).
 It works by repeatedly checking a queue of **callbacks** and executing them in specific **phases**.

**Key point for interviews:**
 Node.js achieves **asynchronous, non-blocking I/O** via the event loop — so long-running tasks don’t freeze the process.

------

## 🔄 Event Loop Phases (in order)

1. **Timers phase** – Executes callbacks from `setTimeout()` and `setInterval()`.
2. **Pending callbacks** – Executes I/O callbacks deferred from the previous cycle.
3. **Idle/Prepare** – Internal use only.
4. **Poll phase** – Retrieves new I/O events; executes I/O callbacks.
5. **Check phase** – Executes `setImmediate()` callbacks.
6. **Close callbacks** – Executes callbacks for closed resources (e.g., sockets).

⚡ Special: **`process.nextTick()`** is not part of these phases — it runs *immediately after the current operation*, before the event loop continues.

------

## 📋 Common Timing APIs

### `setTimeout(callback, delay, ...args)`

Schedules `callback` to run *after at least `delay` ms*.

```js
setTimeout(() => {
  console.log('Run after 1 second');
}, 1000);
```

**Params:**

- `callback` (Function): Code to run later.
- `delay` (Number): Milliseconds (not guaranteed exact).
- `...args` (Any): Extra arguments passed to callback.

------

### `setImmediate(callback, ...args)`

Schedules callback to run **right after the current poll phase**, before timers.

```js
setImmediate(() => console.log('Immediate after I/O'));
```

------

### `process.nextTick(callback, ...args)`

Runs callback **before** the event loop continues to the next phase.
 ⚠ Overuse can starve the loop.

```js
process.nextTick(() => console.log('Runs before timers'));
```

------

## 🛠 Real-World Example: Avoiding Blocking Code

```js
// ❌ Blocking example:
const fs = require('fs');
const data = fs.readFileSync('big.json', 'utf-8'); // blocks event loop
console.log('This runs AFTER file read');

// ✅ Non-blocking example:
fs.readFile('big.json', 'utf-8', (err, data) => {
  if (err) throw err;
  console.log('File read done');
});
console.log('This runs immediately without waiting');
```

**Why it matters in work:**
 If you block the loop (e.g., with heavy computation or sync I/O), you’ll delay API responses, making the app slow for all users.

------

## 🛠 Real-World Example: Understanding Execution Order

```js
console.log('Start');

setTimeout(() => console.log('Timeout'), 0);
setImmediate(() => console.log('Immediate'));
process.nextTick(() => console.log('NextTick'));

console.log('End');
```

**Likely output (Node.js)**:

```
Start
End
NextTick
Timeout
Immediate
```

*(Exact order of `Timeout` vs `Immediate` may vary on system & context)*

------

## ✅ Interview Tips

- Emphasize **non-blocking** and **single-threaded** nature.
- Know when to use **`setImmediate` vs `process.nextTick`**.
- Be ready to explain **why heavy CPU tasks should be moved to Worker Threads or a separate service**.

