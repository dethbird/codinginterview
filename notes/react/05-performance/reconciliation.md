### 📘 React Reconciliation (How React Diffs)

**Reconciliation** is React’s process for comparing the current Virtual DOM tree with the previous one to decide what to update in the real DOM.

Understanding this helps you write components that render efficiently.

------

## 🔹 Key Idea

React uses a **virtual DOM** + **diffing algorithm** to update only what's changed — not the entire UI.

------

## 🔸 How React Diffs the DOM

1. Compares **element types**
2. Reuses DOM nodes if the type is the same
3. Replaces the subtree if the type changes
4. Uses `key` props to optimize list updates

------

## 🔹 Common Scenarios

### ✅ Same component type → props updated

```tsx
<div className="a" /> → <div className="b" />
```

🔁 React reuses the `<div>` and updates the class.

------

### ❌ Different type → DOM replaced

```tsx
<span /> → <div />
```

🧨 Entire `<span>` subtree is destroyed and replaced with `<div>`

------

### ❗ Lists with no keys

```tsx
{items.map(item => <li>{item}</li>)}
```

React can't track which item is which → unnecessary re-renders and bugs.

✅ Always add a `key`:

```tsx
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

------

## 🔸 Why Keys Matter

React uses `key` to:

- Match list items between renders
- Avoid unmounting/remounting
- Improve performance and stability

⚠️ Avoid using `index` as key unless the list is static

------

## 🔹 Custom Component Reconciliation

React considers two function components as **different** if:

- Their type changes
- They unmount/remount during conditional rendering

✅ Stable components = fewer diffs

------

## 🧠 Optimization Tips

- Use `React.memo` to prevent unnecessary re-renders
- Provide stable keys in lists
- Avoid changing component types during conditional rendering (e.g. don’t switch `<div>` ↔ `<span>`)
- Flatten deeply nested trees if possible

------

## 🧪 Interview-style challenge

**Q: Why is this list re-rendering all items every time?**

```tsx
{items.map((item, i) => (
  <ListItem key={i} {...item} />
))}
```

❌ Key is `index`, which changes when items are added/removed/reordered
 ✅ Use a stable `id` instead:

```tsx
{items.map(item => (
  <ListItem key={item.id} {...item} />
))}
```

