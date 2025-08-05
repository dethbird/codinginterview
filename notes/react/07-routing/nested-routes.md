### 📘 Nested Routes (React Router)

Nested routes allow you to define route hierarchies and render parent/child layouts seamlessly.

------

## 🔹 Defining Nested Routes

```tsx
import { Routes, Route, Outlet } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="stats" element={<Stats />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
```

- `<Route>` inside another `<Route>` defines a child route
- `index` prop denotes the default child for the parent path

------

## 🔹 Parent Layout with `<Outlet>`

In the parent component, render an `<Outlet>` where child routes should appear:

```tsx
function DashboardLayout() {
  return (
    <div>
      <nav>
        <Link to="">Overview</Link>
        <Link to="stats">Stats</Link>
        <Link to="settings">Settings</Link>
      </nav>
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}
```

------

## 🔹 URL Structure

| Route Path            | Renders Component              |
| --------------------- | ------------------------------ |
| `/dashboard`          | `DashboardLayout` → `Overview` |
| `/dashboard/stats`    | `DashboardLayout` → `Stats`    |
| `/dashboard/settings` | `DashboardLayout` → `Settings` |

------

## 🔹 Relative vs Absolute Links

- Without a leading slash, `to="stats"` is **relative**
- With leading slash, `to="/dashboard/stats"` is **absolute**

```tsx
<Link to="stats">Stats</Link>      // relative
<Link to="/dashboard/stats">Stats</Link> // absolute 
```

------

## 🔹 Outlet Context

Pass data from parent to children without additional context or props:

```tsx
function DashboardLayout() {
  const user = { name: 'Cher' };
  return (
    <Outlet context={user} />
  );
}

function Overview() {
  const user = useOutletContext<{ name: string }>();
  return <h2>Welcome, {user.name}</h2>;
}
```

------

## 🔹 Index Routes

Use an `index` route for default content at the parent path:

```tsx
<Route path="dashboard" element={<Layout />}>
  <Route index element={<Home />} />
  <Route path="analytics" element={<Analytics />} />
</Route>
```

Visiting `/dashboard` renders `<Home>`, `/dashboard/analytics` renders `<Analytics>`.

------

## 🧠 Best Practices

- Group related views under a common layout
- Use `<Outlet>` once per layout to position children
- Keep route definitions organized in one place (e.g., `AppRoutes.tsx`)
- Leverage `useOutletContext` for simple data passing if needed

------

## 🧪 Interview-style challenge

**Q: Implement nested routes for `/blog` with children `/blog` (list) and `/blog/:postId` (detail), sharing a common sidebar.**

1. Define in your router:

   ```tsx
   <Route path="blog" element={<BlogLayout />}>
     <Route index element={<PostList />} />
     <Route path=":postId" element={<PostDetail />} />
   </Route>
   ```

2. In `BlogLayout`:

   ```tsx
   function BlogLayout() {
     return (
       <div className="blog">
         <Sidebar />
         <Outlet />
       </div>
     );
   }
   ```

   