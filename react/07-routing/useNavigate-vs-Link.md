Here’s your interview-focused notes for `07-routing/useNavigate-vs-Link.md`, highlighting when and how to use each:

------

### 📘 `useNavigate` vs `<Link>` (React Router)

Both let you navigate programmatically or via UI, but serve different use cases.

------

## 🔹 `<Link>`

A component for **declarative**, in-UI navigation. Renders as an `<a>` tag under the hood.

```tsx
import { Link } from 'react-router-dom';

<Link to="/profile">Go to Profile</Link>
```

### ✅ When to use:

- In menus, buttons, navbars, lists
- For SEO / accessibility (renders actual links)
- When navigation is triggered by user clicking UI elements

------

## 🔹 `useNavigate`

A hook for **imperative**, programmatic navigation inside event handlers or effects.

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<button onClick={() => navigate('/dashboard')}>Dashboard</button>
```

### ✅ When to use:

- After form submission (`onSubmit`)
- Inside logic (e.g., redirect if unauthenticated)
- In effects (`useEffect`) for conditional redirects

```tsx
useEffect(() => {
  if (!user) navigate('/login');
}, [user]);
```

------

## 🔸 Differences

| Aspect                    | `<Link>`                               | `useNavigate`                                      |
| ------------------------- | -------------------------------------- | -------------------------------------------------- |
| Syntax                    | JSX component                          | JavaScript hook                                    |
| Accessibility             | Renders `<a>` (tab focus, right-click) | Not inherently accessible, use in buttons or spans |
| Declarative vs Imperative | Declarative                            | Imperative                                         |
| Suitable for              | Static UI links                        | Dynamic or conditional navigation                  |

------

## 🧠 Best Practices

- Use `<Link>` for **standard** navigation elements
- Use `useNavigate` for **conditional** redirects (auth flows, after actions)
- Always consider **accessibility**: wrap `useNavigate` in a `<button>` or make the element keyboard-focusable

------

## 🧪 Interview-style challenge

**Q: After a successful login, redirect the user to `/dashboard`. Which tool do you choose?**

✅ Use `useNavigate` inside the login handler:

```tsx
const navigate = useNavigate();

const handleLogin = async (creds) => {
  const ok = await login(creds);
  if (ok) navigate('/dashboard');
};
```

------

That covers `useNavigate-vs-Link.md`. Ready to move on to `08-state-management/context-api.md` next?