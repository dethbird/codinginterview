### 📘 Zustand (State Management)

Zustand is a small, fast, and scalable state management library with a simple hook-based API.

------

## 🔹 Installation

```bash
npm install zustand
```

------

## 🔹 Creating a Store

```ts
import create from 'zustand';

type State = {
  count: number;
  increment: () => void;
};

const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

------

## 🔹 Using the Store in Components

```tsx
const Counter = () => {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return (
    <>
      <div>Count: {count}</div>
      <button onClick={increment}>Increment</button>
    </>
  );
};
```

------

## 🔹 Features

- **No Provider needed** — global singleton store
- Selective subscriptions — only re-render when selected state changes
- Supports middleware, devtools, persistence
- Simple API — minimal boilerplate compared to Redux

------

## 🔹 Comparison vs Redux

| Feature                | Zustand                        | Redux (RTK)               |
| ---------------------- | ------------------------------ | ------------------------- |
| Boilerplate            | Minimal                        | Moderate (RTK helps)      |
| Learning curve         | Low                            | Moderate                  |
| Middleware             | Optional                       | Built-in support          |
| Devtools               | Yes                            | Yes                       |
| Global store required? | Yes                            | Yes                       |
| Async                  | Handled manually or middleware | Thunks/RTK Query built-in |

------

## 🧪 Interview-style challenge

**Q:** Create a Zustand store to toggle a boolean `isOpen` and use it in a component.

```ts
const useModalStore = create(set => ({
  isOpen: false,
  toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));

const ModalToggle = () => {
  const { isOpen, toggle } = useModalStore();
  return (
    <>
      <button onClick={toggle}>{isOpen ? 'Close' : 'Open'}</button>
      {isOpen && <div>Modal Content</div>}
    </>
  );
};
```

