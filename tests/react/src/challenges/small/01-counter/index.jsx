import React, { useEffect, useState } from 'react'

export default function Counter({ step = 1, initial = 0 }) {
  const [count, setCount] = useState(initial)
  const countKey = 'counter:value';

  localStorage.setItem(countKey, initial);

  useEffect(() => {
    localStorage.setItem(countKey, count);
  }, [count]);

  return (
    <div>
      <p data-testid="value">Value: {count}</p>
      <button onClick={() => setCount(c => c - step)} className="button">-</button>
      <button onClick={() => setCount(c => c + step)} className="button">+</button>
      <button onClick={() => setCount(initial)} className="button">Reset</button>
    </div>
  )
}
