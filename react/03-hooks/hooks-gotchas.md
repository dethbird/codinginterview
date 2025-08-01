### 📘 Hooks Gotchas

React hooks are powerful but come with sharp edges. These are common **pitfalls** that show up in real code and interviews.

------

## 🔸 1. **Stale Closures**

```tsx
const [count, setCount] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // ❌ always logs 0
  }, 1000);
  return () => clearInterval(id);
}, []);
```

✅ Fix with ref:

```tsx
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count;
}, [count]);

useEffect(() => {
  const id = setInterval(() => {
    console.log(countRef.current); // ✅ always up-to-date
  }, 1000);
  return () => clearInterval(id);
}, []);
```

------

## 🔸 2. **Incorrect Dependency Arrays**

```tsx
useEffect(() => {
  doSomething(data); // but data isn't in deps!
}, []); // ❌ only runs once
```

✅ Fix:

```tsx
useEffect(() => {
  doSomething(data);
}, [data]);
```

🧠 Missing dependencies is one of the **most common bugs** in hook-based apps.

------

## 🔸 3. **Functions in deps (changing every render)**

```tsx
useEffect(() => {
  callback(); // will re-run on every render if callback isn't memoized
}, [callback]);
```

✅ Fix with `useCallback`:

```tsx
const callback = useCallback(() => {
  // stable function
}, []);
```

------

## 🔸 4. **Running async directly in `useEffect`**

```tsx
useEffect(async () => {
  // ❌ Not allowed
}, []);
```

✅ Use an inner function:

```tsx
useEffect(() => {
  const fetchData = async () => {
    const res = await fetch('/api');
    const data = await res.json();
    setData(data);
  };
  fetchData();
}, []);
```

------

## 🔸 5. **Skipping cleanup**

Side effects like event listeners, intervals, subscriptions must be cleaned up:

```tsx
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);

  return () => window.removeEventListener('resize', handler); // ✅ cleanup
}, []);
```

------

## 🔸 6. **Mutating state directly**

```tsx
const [list, setList] = useState<string[]>([]);

// ❌ This mutates the array
list.push('new item');
setList(list);
```

✅ Always create a copy:

```tsx
setList(prev => [...prev, 'new item']);
```

------

## 🔸 7. **useEffect without deps when you meant to track something**

```tsx
useEffect(() => {
  fetchData(); // runs on every render (expensive!)
}); // ❌ No deps array
```

✅ Add dependencies or `[]` if only needed once:

```tsx
useEffect(() => {
  fetchData();
}, []); // ✅ run once
```

------

## 🧪 Interview-style challenge

**Q: What's wrong with this code?**

```tsx
const [query, setQuery] = useState('');
useEffect(() => {
  fetch(`/search?q=${query}`);
}, []);
```

❌ `query` is not in the dependency array — the effect will never run again.

✅ Fix:

```tsx
useEffect(() => {
  fetch(`/search?q=${query}`);
}, [query]);
```

