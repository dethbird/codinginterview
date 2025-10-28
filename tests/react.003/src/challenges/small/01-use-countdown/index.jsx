import React, { useEffect, useRef, useState } from 'react'

export default function UseCountdownDemo() {
  const [log, setLog] = useState([])
  // TODO: use your hook instead of the placeholder below
  const [value, start, stop, reset] = useCountdown({from: 3, intervalMs: 1000, onDone: ()=>{console.log('DONE!!')}});

  return (
    <div>
      <div data-testid="value">{value}</div>
      <button className="button" onClick={start}>Start</button>
      <button className="button" onClick={stop}>Stop</button>
      <button className="button" onClick={reset}>Reset</button>
      <pre data-testid="log">{JSON.stringify(log)}</pre>
    </div>
  )
}

// TODO: export your hook here
export function useCountdown({ from, intervalMs = 1000, onDone }) {
  // IMPLEMENT: state for value, a ref for interval id, start/stop/reset handlers,
  // clear on unmount, and call onDone at 0.
  // Return: [value, start, stop, reset]
  const [value, setValue] = useState(from);
  const timerRef = useRef(null);

  const start = () => {
      // return timer if already set
      if (timerRef.current) return timerRef.current;
      
      // start the timer
      timerRef.current = setInterval(() => {

        setValue(v => {
          if (v - 1 <= 0) {
            clearInterval(timerRef.current);
            if (onDone) onDone()
            return 0;
          } else {
            return v - 1;
          }
        });
        
      }, intervalMs);

  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return timerRef.current;
  }

  const reset = () => {
    // do nothing with timer
    setValue(from);
  }


  return [value, start, stop, reset]
}
