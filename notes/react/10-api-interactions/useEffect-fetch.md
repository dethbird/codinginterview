### 📘 Fetching Data in `useEffect`

`useEffect` is the standard place to fetch async data when a component mounts or dependencies change.

------

## 🔹 Basic Pattern

```tsx
useEffect(() => {
  async function fetchData() {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
  }
  fetchData();
}, []); // empty deps → run once on mount
```

------

## 🔹 Cleanup and Cancellation

To prevent setting state on unmounted components, use an abort controller or a mounted flag.

```tsx
useEffect(() => {
  let mounted = true;

  async function load() {
    const res = await fetch('/api/data');
    const json = await res.json();
    if (mounted) setData(json);
  }

  load();

  return () => {
    mounted = false;
  };
}, []);
```

Or with `AbortController`:

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    const res = await fetch('/api/data', { signal: controller.signal });
    const json = await res.json();
    setData(json);
  }

  load();

  return () => controller.abort();
}, []);
```

------

## 🔹 Dependency Management

Include dependencies to re-fetch when they change:

```tsx
useEffect(() => {
  // fetch using userId
}, [userId]);
```

------

## 🔹 Avoiding Infinite Loops

Make sure you don’t update state or create functions/objects in a way that triggers effect reruns unnecessarily.

------

## 🧪 Interview-style challenge

**Q:** Fetch posts whenever `userId` changes, and cancel previous fetch if `userId` updates quickly.

