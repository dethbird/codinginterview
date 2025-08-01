### 📘 React Lifecycle Comparison: Class vs Functional Components

Understanding lifecycle helps manage side effects and data fetching.

------

## 🔹 Mounting Phase

| Class Component       | Functional Component (`useEffect`)          |
| --------------------- | ------------------------------------------- |
| `constructor()`       | Initialization inside component function    |
| `componentDidMount()` | `useEffect(() => { ... }, [])` (empty deps) |
| `render()`            | Return JSX                                  |

------

## 🔹 Updating Phase

| Class Component                            | Functional Component (`useEffect`)                      |
| ------------------------------------------ | ------------------------------------------------------- |
| `componentDidUpdate(prevProps, prevState)` | `useEffect(() => { ... }, [deps])` (deps track changes) |

------

## 🔹 Unmounting Phase

| Class Component          | Functional Component (`useEffect`)         |
| ------------------------ | ------------------------------------------ |
| `componentWillUnmount()` | Cleanup function returned from `useEffect` |

```tsx
useEffect(() => {
  const id = setInterval(() => { ... }, 1000);
  return () => clearInterval(id); // cleanup on unmount
}, []);
```

------

## 🔹 Error Handling

| Class Component                  | Functional Component                    |
| -------------------------------- | --------------------------------------- |
| `componentDidCatch(error, info)` | Use Error Boundaries (class components) |

------

## 🧠 Notes

- Functional components with hooks **combine** lifecycle methods into `useEffect`
- You can have **multiple `useEffect` hooks** to separate concerns
- `useLayoutEffect` runs synchronously after DOM mutations, similar to `componentDidMount` but before painting

------

## 🧪 Interview-style challenge

**Q:** How do you mimic `componentDidMount` and `componentWillUnmount` with hooks?

**A:**

```tsx
useEffect(() => {
  // did mount logic
  return () => {
    // will unmount cleanup
  };
}, []);
```

