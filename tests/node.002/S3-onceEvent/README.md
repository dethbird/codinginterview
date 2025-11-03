# S3 — `onceEvent(emitter, event, { timeoutMs, signal })`

Goal: Return a Promise resolving with the array of event args once. Reject on timeout (TimeoutError) or abort (AbortError). Reject immediately on `'error'` event. Clean up listeners.
