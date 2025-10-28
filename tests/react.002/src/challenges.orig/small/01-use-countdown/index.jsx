import React, { useEffect, useRef, useState } from 'react'

export default function UseCountdownDemo() {
  const [log, setLog] = useState([])
  // TODO: use your hook below once implemented
  const value = 3
  const start = () => setLog(l => [...l, 'start'])
  const stop = () => setLog(l => [...l, 'stop'])
  const reset = () => setLog(l => [...l, 'reset'])

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
// export function useCountdown({ from, intervalMs = 1000, onDone }) { ... }
