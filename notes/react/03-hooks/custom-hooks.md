### 📘 Custom Hooks

Custom hooks let you **extract reusable logic** from components that use other hooks (`useState`, `useEffect`, etc.).

They’re **just functions** that start with `use`.

------

## 🔹 Basic Syntax

```tsx
function useSomething() {
  const [state, setState] = useState(initialValue);
  useEffect(() => {
    // side effects here
  }, []);

  return state;
}
```

Use them exactly like built-in hooks:

```tsx
const value = useSomething();
```

------

## 🔸 Why Use Custom Hooks?

✅ Avoid duplicate code
 ✅ Separate concerns
 ✅ Improve readability
 ✅ Compose logic together

------

## 🔹 Example: useToggle

```tsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn(prev => !prev);
  return [on, toggle] as const;
}
```

Usage:

```tsx
const [isOpen, toggleOpen] = useToggle();
```

------

## 🔹 Example: useFetch

```tsx
function useFetch<T = unknown>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, loading };
}
```

Usage:

```tsx
const { data, loading } = useFetch('/api/users');
```

------

## 🔸 Rules of Custom Hooks

- Must start with `use`
- Can call **other hooks** inside
- Must follow the **Rules of Hooks** (no conditionals/loops)

------

## 🧠 Tips

- Prefix with `use` to enable linting + hook rules
- Return only the values/actions needed
- Treat them like mini-components without JSX

------

## 🧪 Interview-style challenge

**Q: Write a `useCounter` hook with `increment`, `decrement`, and `reset` methods.**

```tsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initial);
  return { count, increment, decrement, reset };
}

// Usage:
const { count, increment, decrement, reset } = useCounter(5);
```

