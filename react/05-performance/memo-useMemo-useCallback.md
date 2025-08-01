### 📘 `React.memo`, `useMemo`, and `useCallback`

These tools help avoid unnecessary re-renders and recomputations in React components.

------

## 🔹 `React.memo` — Component memoization

Wraps a **function component** to skip re-rendering if props don’t change.

```tsx
const MyComponent = React.memo(({ name }: { name: string }) => {
  console.log('Rendering');
  return <p>Hello {name}</p>;
});
```

✅ Only re-renders if `name` changes.

⚠️ Shallow comparison only — objects/functions are considered different if not memoized.

------

## 🔹 `useMemo` — Memoize expensive values

```tsx
const sorted = useMemo(() => {
  return [...list].sort();
}, [list]);
```

✅ Only re-computes when `list` changes.

⚠️ Used for **computed values**, not side effects.

------

## 🔹 `useCallback` — Memoize functions

```tsx
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

✅ Prevents the function from being re-created on every render.

📌 Especially useful when:

- Passing callbacks to child components wrapped in `React.memo`
- Using inside `useEffect`/`useMemo` dependency arrays

------

## 🔸 Example: Preventing Unnecessary Renders

```tsx
const Child = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('Child render');
  return <button onClick={onClick}>Click me</button>;
});

const Parent = () => {
  const [count, setCount] = useState(0);

  // ❌ New function every render -> causes Child to re-render
  // const handleClick = () => setCount(c => c + 1);

  // ✅ useCallback avoids this
  const handleClick = useCallback(() => setCount(c => c + 1), []);

  return <Child onClick={handleClick} />;
};
```

------

## 🔹 When to Use Each

| Tool          | Use When...                                      |
| ------------- | ------------------------------------------------ |
| `React.memo`  | Component re-renders with same props             |
| `useMemo`     | Expensive calculation you want to cache          |
| `useCallback` | Function passed to child / dependency array need |

------

## ⚠️ Gotchas

- **Don’t overuse** these — they add complexity and can slow performance if misused
- Memoization is useful when:
  - Re-renders are causing lag
  - Children depend on stable references
  - Expensive computations are inside render

------

## 🧠 Rule of Thumb

> Don’t optimize until you measure — memoization is a **performance tool**, not a default.

------

## 🧪 Interview-style challenge

**Q: Prevent this child component from re-rendering unnecessarily:**

```tsx
const Button = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('Button render');
  return <button onClick={onClick}>Increment</button>;
});

const Counter = () => {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => setCount(c => c + 1), []);
  return <Button onClick={handleClick} />;
};
```

✅ Use `useCallback` to keep `onClick` stable
 ✅ Use `React.memo` to wrap the child

