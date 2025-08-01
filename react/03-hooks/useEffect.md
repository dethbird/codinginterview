### 📘 `useEffect` Hook

`useEffect` lets you perform side effects (like data fetching, subscriptions, timers) in function components.

------

## 🔹 Basic Syntax

```tsx
useEffect(() => {
  // effect code here
}, [dependencies]);
```

- Runs after the component renders.
- The dependency array determines **when** it runs.

------

## 🔹 Common Use Cases

### ✅ Fetch data on mount

```tsx
useEffect(() => {
  async function fetchData() {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
  }
  fetchData();
}, []); // run once on mount
```

------

### ✅ Re-run effect when props/state change

```tsx
useEffect(() => {
  console.log(`Count is now ${count}`);
}, [count]); // runs whenever `count` changes
```

------

### ✅ Cleanup (like `componentWillUnmount`)

```tsx
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 1000);
  return () => clearInterval(id); // cleanup
}, []);
```

------

## 🔸 Dependency Array Rules

| Dependency array | Effect runs...                    |
| ---------------- | --------------------------------- |
| `[]`             | only once after mount             |
| `[x, y]`         | when `x` or `y` change            |
| *omitted*        | after **every** render (⚠️ avoid!) |

🧠 React compares values by reference — **objects/functions/arrays change on every render** unless memoized.

------

## ⚠️ Common Pitfalls

### ❗ Missing deps

```tsx
useEffect(() => {
  doSomething(data); // but `data` is not in deps!
}, []);
```

✅ Fix:

```tsx
useEffect(() => {
  doSomething(data);
}, [data]);
```

### ❗ Stale closure

```tsx
useEffect(() => {
  const handler = () => console.log(count); // might capture old value
  window.addEventListener('click', handler);
  return () => window.removeEventListener('click', handler);
}, []); // `count` won't update inside handler
```

✅ Fix with dependency or `useRef`

------

## 🔸 Conditionally skipping effects?

Don't do this:

```tsx
if (condition) {
  useEffect(() => { ... }); // ❌ breaks rules of hooks
}
```

✅ Instead, keep the effect and return early inside:

```tsx
useEffect(() => {
  if (!condition) return;
  // effect logic here
}, [condition]);
```

------

## 🧪 Interview-style challenge

**Q: Fetch posts when `userId` changes. Cancel old fetch if a new one starts.**

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function loadPosts() {
    const res = await fetch(`/api/posts?user=${userId}`, {
      signal: controller.signal,
    });
    const data = await res.json();
    setPosts(data);
  }

  loadPosts();

  return () => controller.abort(); // cleanup on userId change
}, [userId]);
```

