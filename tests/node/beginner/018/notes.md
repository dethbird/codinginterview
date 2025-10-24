Exactly — this one’s meant to show you the basic lifecycle of **EventEmitter**: registering listeners, emitting events, removing listeners, and emitting again to see who’s still listening.

You can use plain functions as listeners — they receive whatever you pass to `.emit()`.

Here’s a clean demo:

```js
// emitter-demo.js
'use strict';
const EventEmitter = require('events');

// Create the emitter instance
const bus = new EventEmitter();

// Define two listener functions
function listenerA(value) {
  console.log('Listener A received:', value);
}

function listenerB(value) {
  console.log('Listener B received:', value);
}

// Register both listeners for the 'data' event
bus.on('data', listenerA);
bus.on('data', listenerB);

// Emit values 1..3
for (let i = 1; i <= 3; i++) {
  bus.emit('data', i);
}

// Remove one listener (say, listenerA)
bus.removeListener('data', listenerA);

// Emit again after removal
bus.emit('data', 'final');
```

### What happens when you run it

```
Listener A received: 1
Listener B received: 1
Listener A received: 2
Listener B received: 2
Listener A received: 3
Listener B received: 3
Listener B received: final
```

### Notes

* `bus.on(event, fn)` registers a **persistent** listener.
* `bus.once(event, fn)` registers a listener that auto-removes after one trigger.
* `bus.removeListener(event, fn)` (or `bus.off` in newer Node versions) unregisters a specific function.
* Order matters: listeners fire in the order they were added.

If your test mentions “once vs on,” you could modify one of them to use `.once('data', listenerB)` — it’ll fire only the first time before being automatically removed.
