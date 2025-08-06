Here’s your complete, practical, and interview-ready page for `06-forms/form-validation.md`, covering both custom and library-free approaches:

------

### 📘 Form Validation in React

Form validation ensures user input is correct before submission. In React, you can do it manually or with libraries like `react-hook-form` or `Formik`.

This file focuses on **custom validation logic** — helpful for interviews and lightweight use cases.

------

## 🔹 Controlled Input Validation Example

```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!email.includes('@')) {
    setError('Invalid email');
    return;
  }
  setError('');
  console.log('Submitted:', email);
};
<form onSubmit={handleSubmit}>
  <input
    value={email}
    onChange={e => setEmail(e.target.value)}
    placeholder="Enter your email"
  />
  {error && <p style={{ color: 'red' }}>{error}</p>}
  <button type="submit">Submit</button>
</form>
```

------

## 🔹 Field-by-Field Validation

```tsx
const validateName = (name: string) => {
  if (name.length < 2) return 'Name is too short';
  return '';
};
```

✅ Call this inside `onChange` or `onBlur`
 ✅ Store validation errors per field in state

------

## 🔹 Form-wide Validation with Object Pattern

```tsx
const [form, setForm] = useState({ name: '', email: '' });
const [errors, setErrors] = useState<{ [key: string]: string }>({});

const validate = () => {
  const newErrors: typeof errors = {};
  if (form.name.trim().length < 2) newErrors.name = 'Too short';
  if (!form.email.includes('@')) newErrors.email = 'Invalid email';
  return newErrors;
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const validation = validate();
  setErrors(validation);
  if (Object.keys(validation).length === 0) {
    console.log('Valid submission:', form);
  }
};
```

------

## 🔹 Real-Time vs On-Submit

| Strategy  | Description                        |
| --------- | ---------------------------------- |
| On submit | Validate after user presses submit |
| On change | Validate as user types (real-time) |
| On blur   | Validate when leaving input field  |

Use the right strategy based on UX needs.

------

## 🧠 UX Tips

- Only show errors after a field has been touched or submitted
- Disable submit until all required fields are filled (optional)
- Focus the first invalid field on submit if needed

------

## 🔸 Native Validation (fallback option)

```tsx
<form onSubmit={handleSubmit}>
  <input type="email" required />
  <button>Submit</button>
</form>
```

✅ Browser-enforced
 ❌ Limited control or custom error display

------

## 🧪 Interview-style challenge

**Q: Build a name input that shows a red error if name is less than 3 characters after blur.**

```tsx
const [name, setName] = useState('');
const [touched, setTouched] = useState(false);

const isInvalid = touched && name.length < 3;

return (
  <>
    <input
      value={name}
      onChange={e => setName(e.target.value)}
      onBlur={() => setTouched(true)}
    />
    {isInvalid && <p style={{ color: 'red' }}>Name too short</p>}
  </>
);
```

------

Would you like to continue with `form-libs.md` next (react-hook-form, Formik, etc.)?