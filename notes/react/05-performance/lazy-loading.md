### 📘 Lazy Loading Components in React

**Lazy loading** means deferring the loading of a component until it's actually needed — this reduces initial bundle size and improves load times.

------

## 🔹 `React.lazy` + `Suspense`

Used to dynamically load components **only when rendered**.

```tsx
import { lazy, Suspense } from 'react';

const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Settings />
    </Suspense>
  );
}
```

✅ `Settings` is not included in the main JS bundle
 ✅ React loads it **on-demand**

------

## 🔸 Why Use It?

✅ Improves initial page load
 ✅ Avoids loading rarely-used components up front
 ✅ Works well with code splitting in bundlers like Webpack or Vite

------

## 🔸 Where to Use It

- **Route-based splitting** (e.g., `/settings`, `/profile`)
- Heavy components (modals, editors, charts)
- Admin-only or feature-flagged UI

------

## 🔹 Lazy with Routing (React Router)

```tsx
const Profile = lazy(() => import('./Profile'));

<Routes>
  <Route
    path="/profile"
    element={
      <Suspense fallback={<p>Loading...</p>}>
        <Profile />
      </Suspense>
    }
  />
</Routes>
```

✅ This ensures `Profile` is only fetched when that route is visited

------

## ⚠️ Gotchas

- Must wrap lazy-loaded components in a `<Suspense>` boundary
- Works only for default exports (`export default ...`)
- Server-side rendering requires `React.lazy` alternatives (e.g. `loadable-components`)

------

## 🔹 Dynamic Import (non-React case)

You can use `import()` anywhere — not just with `React.lazy`

```ts
if (condition) {
  const module = await import('./heavy-utils');
  module.doSomething();
}
```

✅ Great for conditionally loading logic-heavy utilities or admin-only features

------

## 🧪 Interview-style challenge

**Q: Lazy-load a `Chart` component and show a spinner while it loads**

```tsx
const Chart = lazy(() => import('./Chart'));

return (
  <Suspense fallback={<Spinner />}>
    <Chart />
  </Suspense>
);
```

