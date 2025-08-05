### 📘 Controlled Inputs in React

A **controlled input** is an input field (text, checkbox, etc.) whose value is managed by React via state.

------

## 🔹 Basic Pattern

```tsx
const [name, setName] = useState('');

return (
  <input
    type="text"
    value={name}
    onChange={e => setName(e.target.value)}
  />
);
```

✅ React owns the input’s value
 ✅ Re-render occurs on every keystroke
 ✅ Enables validation, formatting, or conditional logic

------

## 🔹 Checkbox Example

```tsx
const [checked, setChecked] = useState(false);

return (
  <input
    type="checkbox"
    checked={checked}
    onChange={e => setChecked(e.target.checked)}
  />
);
```

------

## 🔹 Select Dropdown

```tsx
const [option, setOption] = useState('apple');

return (
  <select value={option} onChange={e => setOption(e.target.value)}>
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
  </select>
);
```

------

## 🔸 Textarea

```tsx
const [message, setMessage] = useState('');

return (
  <textarea
    value={message}
    onChange={e => setMessage(e.target.value)}
  />
);
```

------

## 🔸 Multiple Inputs (Form Object Pattern)

```tsx
const [form, setForm] = useState({ name: '', email: '' });

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
};

return (
  <>
    <input name="name" value={form.name} onChange={handleChange} />
    <input name="email" value={form.email} onChange={handleChange} />
  </>
);
```

🧠 This is a scalable pattern for large forms.

------

## ⚠️ Gotchas

- Every input **must** have both `value` and `onChange`
- Don’t forget to initialize state (e.g. `''` for strings, `false` for checkboxes)
- Avoid uncontrolled → controlled transition warnings

------

## 🔸 Controlled vs Uncontrolled Recap

| Feature        | Controlled Input          | Uncontrolled Input        |
| -------------- | ------------------------- | ------------------------- |
| Value source   | React state               | DOM (`ref.current.value`) |
| Best for       | Validation, dynamic logic | Simple/static input       |
| Reset handling | Easy                      | Manual via `ref`          |

------

## 🧪 Interview-style challenge

**Q: Build a controlled form with a name field and submit button.**

```tsx
const [name, setName] = useState('');

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  alert(`Hello, ${name}`);
};

return (
  <form onSubmit={handleSubmit}>
    <input value={name} onChange={e => setName(e.target.value)} />
    <button type="submit">Submit</button>
  </form>
);
```

