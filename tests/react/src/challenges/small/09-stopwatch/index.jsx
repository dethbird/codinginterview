import React, { useEffect, useRef, useState } from 'react'

export default function Stopwatch() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const lastStartRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!running) return
    lastStartRef.current = performance.now()
    const tick = (now) => {
      setElapsed(e => e + (now - lastStartRef.current))
      lastStartRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  return (
    <div>
      <div data-testid="elapsed">{Math.floor(elapsed / 1000)}s</div>
      <button onClick={() => setRunning(true)}>Start</button>
      <button onClick={() => setRunning(false)}>Pause</button>
      <button onClick={() => { setRunning(false); setElapsed(0) }}>Reset</button>
    </div>
  )
}
