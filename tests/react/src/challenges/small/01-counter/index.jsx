import React, { useEffect, useState } from 'react'

export default function Counter({ step = 1, initial = 0 }) {
  const [count, setCount] = useState(initial)

  // TODO: Bonus - load/save from localStorage

  return (
    <div>
      <p data-testid="value">Value: {count}</p>
      <button onClick={() => setCount(c => c - step)}>-</button>
      <button onClick={() => setCount(c => c + step)}>+</button>
      <button onClick={() => setCount(initial)}>Reset</button>
    </div>
  )
}
