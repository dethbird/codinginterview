### 📘 React Router Basics

React Router is the de facto standard for routing in React apps. It lets you define client-side routes and navigate between them.

------

## 🔹 Installation & Setup

```bash
npm install react-router-dom
```

Wrap your app in a router (usually in `index.tsx`):

```tsx
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
```

------

## 🔹 Core Components

### `<Routes>` & `<Route>`

Defines the route configuration:

```tsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

- **path**: URL pattern
- **element**: component to render

------

## 🔹 Navigation

### `<Link>`

Client-side navigation without full reload:

```tsx
import { Link } from 'react-router-dom';

<Link to="/about">About</Link>
```

### `useNavigate`

Programmatic navigation:

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');
```

------

## 🔹 Route Matching

- Exact matching is now default.
- Use `*` wildcards for catch-alls:

```tsx
<Route path="users/*" element={<Users />} />
```

Inside `<Users>`, you’ll define nested routes (next file).

------

## 🔹 URL Parameters

Capture dynamic segments:

```tsx
<Route path="/users/:id" element={<UserProfile />} />
```

In `UserProfile`:

```tsx
import { useParams } from 'react-router-dom';
const { id } = useParams<{ id: string }>();
```

------

## 🔹 Query Params & Location

Read search parameters:

```tsx
import { useLocation } from 'react-router-dom';

const { search } = useLocation();
const params = new URLSearchParams(search);
const page = params.get('page');
```

------

## 🧠 Best Practices

- Keep routes in **one place** (e.g. a `routes.tsx` file)
- Use `/` vs `*` carefully for fallbacks
- Always include a 404 route (`path="*"`)
- Use `Link`/`NavLink` for accessibility and active styles

------

## 🧪 Interview-style challenge

**Q: Create a route for `/products/:productId` and navigate to it when clicking a product card.**

```tsx
// In App.tsx
<Route path="/products/:productId" element={<ProductDetail />} />

// In ProductCard.tsx
<Link to={`/products/${product.id}`}>{product.name}</Link>
```

In `ProductDetail`:

```tsx
const { productId } = useParams<{ productId: string }>();
```

