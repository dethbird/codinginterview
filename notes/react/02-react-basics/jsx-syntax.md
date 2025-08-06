### 📘 JSX Syntax (React Basics)

JSX (JavaScript XML) lets you write HTML-like syntax in JavaScript. It gets compiled to `React.createElement()` calls.

```tsx
const element = <h1>Hello, world!</h1>;
```

------

## 🔹 JSX Rules

### ✅ One parent element per return

Wrap multiple elements in a parent (`div`, `<>`, etc.)

```tsx
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);
```

### ✅ Expressions only

You can use JS **expressions**, not statements.

```tsx
const name = 'Cher';
return <p>{name}</p>; // ✅

return <p>{if (name) { ... }}</p>; // ❌ invalid
```

✅ Use ternary for conditionals, not `if`

------

## 🔹 Embedding JavaScript

Wrap JavaScript expressions inside `{}`:

```tsx
<p>{user.name}</p>
<p>{count + 1}</p>
<p>{new Date().toLocaleDateString()}</p>
```

------

## 🔹 Attributes in JSX

- Use `camelCase` (e.g. `className`, `onClick`)
- Boolean attributes: `disabled`, `checked` are just `true`/`false`

```tsx
<button className="btn" disabled={isLoading}>Submit</button>
```

------

## 🔹 Self-closing tags

You must self-close void elements like `<img />`, `<input />`

```tsx
<img src="/logo.png" alt="Logo" />
```

------

## 🔹 Components vs HTML Tags

- **Uppercase** tags = components
- **Lowercase** tags = HTML

```tsx
<MyComponent /> // React component
<div />         // HTML element
```

------

## 🔹 JSX Gotchas

### ❗ Use `key` in `.map()`

```tsx
{items.map((item, i) => (
  <li key={item.id ?? i}>{item.label}</li>
))}
```

### ❗ You can't return multiple siblings without wrapping

```tsx
// ❌ Invalid
return <h1 /> <p />;

// ✅ Wrap with fragment
return (
  <>
    <h1 />
    <p />
  </>
);
```

------

## 🧠 JSX under the hood

```tsx
const el = <h1>Hello</h1>;
// Compiles to:
const el = React.createElement('h1', null, 'Hello');
```

------

## 🧪 Interview-style challenge

**Q: What’s wrong with this JSX?**

```tsx
return (
  <h1>Hello</h1>
  <p>World</p>
);
```

❌ You need a wrapper (like `<>...</>`) to return multiple elements.

