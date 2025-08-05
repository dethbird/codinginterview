### 📘 React Hooks Cheatsheet

------

## 🔹 Basic Hooks

| Hook         | Purpose                             | Example                                   |
| ------------ | ----------------------------------- | ----------------------------------------- |
| `useState`   | State in function components        | `const [count, setCount] = useState(0);`  |
| `useEffect`  | Side effects (fetch, subscriptions) | `useEffect(() => { fetchData(); }, []);`  |
| `useRef`     | Mutable refs to DOM or values       | `const inputRef = useRef(null);`          |
| `useContext` | Consume React Context               | `const theme = useContext(ThemeContext);` |

------

## 🔹 Performance Hooks

| Hook          | Purpose                        | Example                                                 |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| `React.memo`  | Memoize functional components  | `export default React.memo(MyComponent);`               |
| `useMemo`     | Memoize expensive calculations | `const sorted = useMemo(() => items.sort(), [items]);`  |
| `useCallback` | Memoize callback functions     | `const onClick = useCallback(() => doSomething(), []);` |

------

## 🔹 Rules of Hooks

- Only call hooks at the **top level** of React functions
- Only call hooks from **React function components** or **custom hooks**
- Use hooks **in the same order** on every render

------

## 🔹 Custom Hooks

- Must start with `use`
- Encapsulate reusable hook logic
- Can call other hooks inside

------

## 🔹 Common Pitfalls

- Missing dependencies in `useEffect`
- Stale closures — old values captured inside effects or callbacks
- Conditional hooks — calling hooks inside `if`, loops, or nested functions

------

## 🧪 Interview-style challenge

**Q:** Write a custom hook `useToggle` to toggle a boolean value.

```tsx
function useToggle(initial = false) {
  const [state, setState] = useState(initial);
  const toggle = () => setState(s => !s);
  return [state, toggle] as const;
}
```

