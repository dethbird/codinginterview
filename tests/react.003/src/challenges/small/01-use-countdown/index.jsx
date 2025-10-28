import React, { useEffect, useRef, useState } from 'react'

export default function UseCountdownDemo() {
  const [log, setLog] = useState([])
  // TODO: use your hook instead of the placeholder below
  const [value, start, stop, reset] = [3, () => setLog(l => [...l, 'start']), () => setLog(l => [...l, 'stop']), () => setLog(l => [...l, 'reset'])]

  return (
    <div>
      <div data-testid="value">{value}</div>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
      <pre data-testid="log">{JSON.stringify(log)}</pre>
    </div>
  )
}

// TODO: export your hook here
export function useCountdown({ from, intervalMs = 1000, onDone }) {
  // IMPLEMENT: state for value, a ref for interval id, start/stop/reset handlers,
  // clear on unmount, and call onDone at 0.
  // Return: [value, start, stop, reset]
  return [from, () => {}, () => {}, () => {}]
}
