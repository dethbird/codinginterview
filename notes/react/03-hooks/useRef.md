### 📘 `useRef` Hook

`useRef` gives you a **mutable value** that survives re-renders. It does **not** trigger a re-render when updated.

------

## 🔹 Syntax

```tsx
const ref = useRef<HTMLElement | null>(null);
```

- `ref.current` holds the value
- You can assign a DOM node or any mutable value to it

------

## 🔹 Use Cases

### ✅ Accessing DOM elements

```tsx
const inputRef = useRef<HTMLInputElement>(null);

const focusInput = () => {
  inputRef.current?.focus();
};

return <input ref={inputRef} />;
```

🧠 Think of `ref` as a pointer to the DOM node.

------

### ✅ Keeping mutable values without triggering re-renders

```tsx
const countRef = useRef(0);

useEffect(() => {
  const interval = setInterval(() => {
    countRef.current++;
    console.log('Count:', countRef.current); // updates but doesn't rerender
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

✅ Useful for timers, tracking values over time.

------

### ✅ Avoiding stale closures in effects

```tsx
const latestValue = useRef(value);

useEffect(() => {
  latestValue.current = value;
}, [value]);

useEffect(() => {
  const handler = () => {
    console.log(latestValue.current); // always fresh!
  };
  window.addEventListener('click', handler);
  return () => window.removeEventListener('click', handler);
}, []);
```

------

## 🔸 Important Notes

- Updating `ref.current` **won’t trigger a re-render**
- `useRef` is **not reactive**
- Great for:
  - DOM access
  - Tracking timers or event values
  - Persisting mutable state across renders

------

## 🔸 Avoid this mistake

```tsx
const [value, setValue] = useState(0);
const ref = useRef(0);

// ❌ bad: ref used as state
ref.current++; // won’t trigger re-render

// ✅ use setState instead if you want the UI to update
```

------

## 🧪 Interview-style challenge

**Q: Create a component with an input and a button. Clicking the button focuses the input.**

```tsx
const FocusInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
};
```

