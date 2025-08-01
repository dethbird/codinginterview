### 📘 Controlled vs Uncontrolled Components

These patterns are **especially important in forms**. React allows you to manage form input in two ways:

------

## 🔹 Controlled Components (✅ preferred)

The value is managed by **React state**.

```tsx
const [name, setName] = useState('');

return (
  <input
    value={name}
    onChange={e => setName(e.target.value)}
  />
);
```

### ✅ Features:

- Fully predictable — single source of truth
- Easy to validate, transform, or conditionally disable
- Ideal for dynamic forms or validation logic

------

## 🔹 Uncontrolled Components

The value lives in the **DOM**, accessed via a `ref`.

```tsx
const inputRef = useRef<HTMLInputElement>(null);

const handleSubmit = () => {
  alert(inputRef.current?.value);
};

return <input ref={inputRef} />;
```

### ✅ Features:

- Minimal setup, good for quick/simple inputs
- Useful for 3rd-party libraries or file inputs

------

## 🔸 Which should I use?

| Feature                   | Controlled          | Uncontrolled     |
| ------------------------- | ------------------- | ---------------- |
| React state sync          | ✅ Yes               | ❌ No             |
| Validation                | ✅ Easy              | ⚠️ Manual         |
| File inputs               | ⚠️ Inconvenient      | ✅ Recommended    |
| Performance (large forms) | ⚠️ Can degrade       | ✅ More efficient |
| 3rd-party integration     | ⚠️ May need adapters | ✅ Easy           |

------

## 🔹 Mixing Both

You can use both together — e.g., uncontrolled `<input type="file">` with controlled metadata.

------

## ⚠️ Gotchas

- Controlled inputs **must** have an `onChange` handler if they have a `value`
- Uncontrolled inputs **lose React tracking** — you’ll need to manage focus, validation, and clearing manually
- Don’t mix controlled/uncontrolled state for the same input — it throws a warning

```tsx
// ❌ This will throw a warning
<input value={name} ref={inputRef} />
```

------

## 🧪 Interview-style challenge

**Q: Convert this uncontrolled input to a controlled one**

```tsx
const inputRef = useRef(null);
return <input ref={inputRef} />;
```

✅ Controlled version:

```tsx
const [value, setValue] = useState('');
return (
  <input
    value={value}
    onChange={e => setValue(e.target.value)}
  />
);
```

