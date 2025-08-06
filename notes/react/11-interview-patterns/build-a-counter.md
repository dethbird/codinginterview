### 📘 Build a Counter Component

A simple counter with increment, decrement, and reset functionality is a common interview test.

------

## 🔹 Basic Counter Using `useState`

```tsx
import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  );
};
```

------

## 🔹 Explanation

- `useState` holds the current count
- Increment/decrement functions update state using functional updates (`c => c + 1`)
- Reset sets count to initial value

------

## 🔹 Variations

- Add a step input to increment by custom values
- Disable decrement button at zero
- Add keyboard support for increment/decrement keys

------

## 🧪 Interview-style challenge

**Q:** Extend this counter to limit count between 0 and 10.

```tsx
<button
  onClick={() => setCount(c => Math.min(10, c + 1))}
  disabled={count === 10}
>
  Increment
</button>
```

