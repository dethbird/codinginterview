export function onceEvent(emitter, event, { timeoutMs, signal } = {}) {
  return new Promise((resolve, reject) => {
    let to = null;
    function onEvent(...args) { cleanup(); resolve(args); }
    function onError(err) { cleanup(); reject(err); }
    function onAbort() { cleanup(); const e = new Error('AbortError'); e.name='AbortError'; reject(e); }
    function onTimeout() { cleanup(); const e = new Error('TimeoutError'); e.name='TimeoutError'; reject(e); }
    function cleanup() {
      emitter.off(event, onEvent);
      emitter.off('error', onError);
      signal?.removeEventListener('abort', onAbort);
      if (to) clearTimeout(to);
    }
    if (timeoutMs != null) to = setTimeout(onTimeout, timeoutMs);
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
    emitter.once(event, onEvent);
    emitter.once('error', onError);
  });
}
