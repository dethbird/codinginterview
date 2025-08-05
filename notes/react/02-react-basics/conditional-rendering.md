### 📘 Conditional Rendering (React Basics)

React lets you show or hide elements based on conditions, just like regular JS. There are several patterns depending on complexity and style preference.

------

## 🔹 Using `if` before `return`

Best for **early exits** or more verbose conditions:

```tsx
if (!user) {
  return <p>Loading...</p>;
}

return <p>Hello, {user.name}</p>;
```

🧠 This is a common pattern when loading data.

------

## 🔹 Ternary Operator (`? :`)

Use for inline conditional rendering:

```tsx
<p>{isLoggedIn ? 'Welcome!' : 'Please log in'}</p>
```

Can be used inside JSX or as a full return:

```tsx
return isAdmin ? <AdminPanel /> : <UserPanel />;
```

------

## 🔹 `&&` Short-circuit Rendering

Renders the right-hand side **only if** the left-hand side is truthy:

```tsx
{isLoading && <p>Loading...</p>}
```

⚠️ Don’t use this with values that might be `0`, as `0 && ...` will render `0`.

------

## 🔹 Conditional classes/styles

Use ternaries or template strings to apply conditional classes:

```tsx
<button className={isActive ? 'btn-active' : 'btn'}>
  Click me
</button>
```

Or:

```tsx
<div style={{ color: error ? 'red' : 'black' }}>
  {message}
</div>
```

------

## 🔹 Avoiding undefined returns

If your component conditionally returns `null`, be intentional:

```tsx
if (!visible) return null;
```

✅ This is fine — React will skip rendering.

------

## 🧠 Best Practices

- For **simple presence**, use `&&`
- For **if/else**, use ternary
- For **multiple cases**, use `switch` or early `if` blocks
- Return `null` to render nothing cleanly

------

## 🧪 Interview-style challenge

**Q: Conditionally render a user profile. If `user` is null, show “Loading…”**

```tsx
{user ? (
  <div>
    <h2>{user.name}</h2>
    <p>{user.email}</p>
  </div>
) : (
  <p>Loading...</p>
)}
```