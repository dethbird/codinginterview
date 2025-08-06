### 📘 `useContext` Hook

`useContext` lets you read values from a React Context — useful for sharing state or functions across many components without prop drilling.

------

## 🔹 Context Overview

### ✅ Create a context

```tsx
const ThemeContext = React.createContext<'light' | 'dark'>('light');
```

### ✅ Provide a value

Wrap a part of your tree with the provider:

```tsx
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

### ✅ Consume with `useContext`

```tsx
const theme = useContext(ThemeContext);
return <p>Current theme: {theme}</p>;
```

------

## 🔸 Common Use Case: Theme or Auth

```tsx
// ThemeContext.tsx
export const ThemeContext = React.createContext('light');

// App.tsx
<ThemeContext.Provider value="dark">
  <Page />
</ThemeContext.Provider>

// Page.tsx
const theme = useContext(ThemeContext);
```

🧠 You can move context into its own file for reuse.

------

## 🔸 Sharing State via Context

You can pass not just values, but functions and setters too:

```tsx
const CountContext = React.createContext<{
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
} | null>(null);

const Parent = () => {
  const [count, setCount] = useState(0);
  return (
    <CountContext.Provider value={{ count, setCount }}>
      <Child />
    </CountContext.Provider>
  );
};

const Child = () => {
  const ctx = useContext(CountContext);
  if (!ctx) return null;
  return <button onClick={() => ctx.setCount(c => c + 1)}>Count: {ctx.count}</button>;
};
```

------

## 🔸 Gotchas

- ❗ You must use `useContext` inside a **descendant** of the provider
- ❗ Don't use context for high-frequency updates (use state lifting or a global store)
- ❗ No reactivity without a Provider — fallback value is only used when no Provider exists above

------

## 🔹 When to Use Context

✅ Great for:

- Themes
- Auth user info
- Shared callbacks
- Global toggles

⛔ Avoid for:

- Large app-wide state (prefer Zustand/Redux)
- Frequently updated data (e.g. mouse position, drag)

------

## 🧪 Interview-style challenge

**Q: Create a context for auth with `user` and `logout`**

