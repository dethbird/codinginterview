### 📘 JSX Gotchas

------

## 🔹 JSX Must Return One Parent Element

```tsx
// ❌ This will cause an error
return (
  <h1>Hello</h1>
  <p>World</p>
);

// ✅ Wrap in a fragment or div
return (
  <>
    <h1>Hello</h1>
    <p>World</p>
  </>
);
```

------

## 🔹 JavaScript Expressions Only

JSX can embed **expressions**, but **not statements**.

```tsx
// ❌ Invalid
return <p>{if (x > 0) 'Yes'}</p>;

// ✅ Use ternary or && operator
return <p>{x > 0 ? 'Yes' : 'No'}</p>;
```

------

## 🔹 Keys in Lists Must Be Unique and Stable

```tsx
// ❌ Using index can cause bugs if list changes
{items.map((item, i) => <li key={i}>{item}</li>)}

// ✅ Use stable IDs
{items.map(item => <li key={item.id}>{item}</li>)}
```

------

## 🔹 Self-Closing Tags

Always self-close tags without children:

```tsx
// ❌
<img src="logo.png"></img>

// ✅
<img src="logo.png" />
```

------

## 🔹 Class vs className

Use `className` in JSX, not `class`.

```tsx
<div className="container"></div>
```

------

## 🔹 Attribute Names are camelCase

Use `onClick`, `tabIndex`, `readOnly`, not lowercase.

```tsx
<button onClick={handleClick}>Click</button>
```

------

## 🧪 Interview-style challenge

**Q:** Why does this code cause an error?

```tsx
return (
  <div>
    {someCondition && <Component />}
  </div>
  <p>Extra element</p>
);
```

**A:** JSX returned must have one parent — the `<p>` is a sibling outside the `<div>`.

