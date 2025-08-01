### 📘 Common Tricky React Interview Questions

------

## 🔹 useEffect Infinite Loop

```tsx
useEffect(() => {
  setCount(count + 1); // causes infinite re-render loop
}, [count]);
```

**Fix:** Avoid setting state that’s in the dependency list without conditions.

------

## 🔹 Stale Closures

Problem: functions inside `useEffect` capturing stale state.

```tsx
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // always old count
  }, 1000);
  return () => clearInterval(id);
}, []);
```

**Fix:** Use refs or add dependencies properly.

------

## 🔹 Keys in Lists

Using array index as key can cause bugs on insertions/deletions.

```tsx
{items.map((item, i) => <li key={i}>{item.text}</li>)}
```

**Fix:** Use stable unique IDs.

------

## 🔹 Event Handler Binding

```tsx
<button onClick={handleClick.bind(this)}>Click</button>
```

**Fix:** Use arrow functions or memoized callbacks to avoid re-creation.

------

## 🔹 Conditional Hooks

Hooks must be called unconditionally:

```tsx
if (isOpen) {
  useEffect(() => { ... }); // ❌ breaks rules of hooks
}
```

**Fix:** Call hooks always, put conditional logic inside.

------

## 🔹 Prop Drilling

Passing props down many levels makes code hard to maintain.

**Fix:** Use Context or state management libraries.

------

## 🧪 Interview-style challenge

**Q:** Why do hooks have to be called at the top level, and never inside loops or conditions?

**A:** To ensure the hooks call order is stable between renders for React to track state correctly.