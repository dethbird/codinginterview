### 📘 Props and State (React Basics)

Both `props` and `state` help control data in components, but they serve different purposes.

------

## 🔹 Props (short for “properties”)

Props are **read-only** inputs to a component — like function arguments.

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

<Greeting name="Cher" />
```

### ✅ Key points:

- Passed from parent → child
- Immutable inside the component
- Great for config-style inputs

🧠 Tip: Use destructuring in the parameter for cleaner syntax.

------

## 🔹 State

State is **local data** that a component owns and can change.

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

### ✅ Key points:

- Managed via `useState`, `useReducer`, etc.
- Triggers re-render on change
- Should be kept minimal and specific

------

## 🔸 Props vs State

| Aspect   | Props                    | State               |
| -------- | ------------------------ | ------------------- |
| Source   | Parent component         | Component itself    |
| Mutable? | ❌ No (read-only)         | ✅ Yes (use hooks)   |
| Usage    | Configure child behavior | Handle dynamic data |

------

## 🔹 When to use props vs state?

- **Props**: Data comes from a parent
- **State**: Data changes inside the component
- If data needs to be **shared**, lift state up and pass as props

------

## 🔸 Passing functions via props

Useful for child → parent communication:

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  return <Child onClick={() => setCount(count + 1)} />;
}

function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click Me</button>;
}
```

------

## 🧪 Interview-style challenge

**Q: What’s the difference in behavior here?**

```tsx
function Parent() {
  const [name, setName] = useState('Cher');
  return <Child name={name} />;
}

function Child({ name }: { name: string }) {
  return <p>{name}</p>;
}
```

**A:**

- `name` is passed via props — if `Parent` changes it, `Child` re-renders.
- `Child` cannot change `name` directly — it must notify `Parent` via a function prop.