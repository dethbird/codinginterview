### 📘 Lifting State Up

**Lifting state up** means moving shared state to the **closest common ancestor** of two or more components that need to access or update it.

This is a core React pattern for enabling component coordination.

------

## 🔹 When to Lift State

✅ You need:

- Sibling components to share data
- A child to update parent-level state
- To avoid duplication or desync of state

------

## 🔹 Example: Syncing Siblings

**Before: local state in each component (unsynced)**

```tsx
const Left = () => {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
};

const Right = () => {
  return <p>Something else...</p>;
};
```

**After: lift state up**

```tsx
const Parent = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <Left value={value} onChange={setValue} />
      <Right value={value} />
    </>
  );
};

const Left = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <input value={value} onChange={e => onChange(e.target.value)} />
);

const Right = ({ value }: { value: string }) => (
  <p>You typed: {value}</p>
);
```

------

## 🔹 Best Practices

- Lift state only as far as necessary
- Pass **handlers** (e.g., `onChange`) down as props
- Avoid “prop drilling hell” — if many layers are involved, consider Context

------

## 🔸 Lifting State vs Context

| Feature    | Lifting State           | Context                  |
| ---------- | ----------------------- | ------------------------ |
| Scope      | One component tree      | App-wide (if needed)     |
| Re-renders | ✅ Per state update      | ⚠️ All consumers rerender |
| Usage      | Few components involved | Many levels or branches  |

------

## 🔹 Common Pattern: Child updates Parent

```tsx
const Parent = () => {
  const [name, setName] = useState('');
  return <Child onSubmit={setName} />;
};

const Child = ({ onSubmit }: { onSubmit: (v: string) => void }) => {
  const [input, setInput] = useState('');
  return (
    <form onSubmit={e => {
      e.preventDefault();
      onSubmit(input);
    }}>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
};
```

------

## 🧠 Summary

Lifting state up:

- Keeps data in sync
- Helps sibling or deeply nested components share logic
- Is the **default approach** before reaching for context or global state

------

## 🧪 Interview-style challenge

**Q: Two components show the same input value. Where should the state live?**

✅ Answer: In their closest common ancestor.

