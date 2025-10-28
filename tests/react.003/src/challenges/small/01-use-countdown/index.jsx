import React, { useEffect, useRef, useState, useCallback } from 'react'

export default function UseCountdownDemo() {
  const [log, setLog] = useState([])
  const [value, start, stop, reset] = useCountdown({
    from: 10, intervalMs: 1000,
    onDone: () => setLog(l => [...l, 'done'])
  })

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

export function useCountdown({ from, intervalMs = 1000, onDone }) {
  const [value, setValue] = useState(from)
  const timerRef = useRef(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setValue(v => {
        if (v <= 1) {
          clear(); onDone?.(); return 0
        }
        return v - 1
      })
    }, intervalMs)
  }, [clear, intervalMs, onDone])

  const stop = clear
  const reset = useCallback(() => { clear(); setValue(from) }, [clear, from])

  useEffect(() => clear, [clear])
  return [value, start, stop, reset]
}
