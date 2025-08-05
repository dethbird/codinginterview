### 📘 `useState` Hook

`useState` lets you add local state to **function components**. It’s one of the most-used React hooks.

```tsx
const [count, setCount] = useState(0);
```

------

## 🔹 Syntax

```tsx
const [state, setState] = useState(initialValue);
```

- `state`: current value
- `setState`: function to update the value
- Triggers a **re-render** when called

------

## 🔹 Examples

### ✅ Counter

```tsx
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
};
```

------

### ✅ Toggle

```tsx
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen(prev => !prev);
```

🧠 Use updater functions (`prev => ...`) when the next state depends on the previous state.

------

### ✅ Form Input

```tsx
const [name, setName] = useState('');

<input value={name} onChange={e => setName(e.target.value)} />
```

🧠 Controlled components require syncing input value with state.

------

## 🔸 Can hold any type

```tsx
useState<string | null>(null);
useState<number[]>([]);
useState<{ name: string; age: number }>({ name: '', age: 0 });
```

------

## 🔸 Multiple state variables

You can call `useState` multiple times in the same component:

```tsx
const [name, setName] = useState('');
const [age, setAge] = useState(0);
```

------

## ⚠️ Gotchas

- ❌ `setState` is async — don’t rely on the updated value immediately.
- ❌ Never update state directly (e.g. `state.push(...)`)
- ✅ Always use `setState` to trigger re-render.

------

## 🔸 Initializer function (lazy init)

Useful for expensive default calculations:

```tsx
const [value, setValue] = useState(() => expensiveComputation());
```

------

## 🧪 Interview-style challenge

**Q: Implement a simple toggle component that switches between “On” and “Off”**

```tsx
const Toggle = () => {
  const [on, setOn] = useState(false);
  return (
    <button onClick={() => setOn(prev => !prev)}>
      {on ? 'On' : 'Off'}
    </button>
  );
};
```

