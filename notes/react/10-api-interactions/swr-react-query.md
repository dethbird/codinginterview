### 📘 SWR vs React Query

Both libraries provide hooks for data fetching, caching, and updating UI reactively with great developer experience.

------

## 🔹 SWR (stale-while-revalidate)

- Created by Vercel
- Simple, minimal API
- Auto revalidation, caching, refetch on focus

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  if (error) return <div>Error</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data.name}</div>;
}
```

------

## 🔹 React Query

- More feature-rich and configurable
- Supports mutations, pagination, infinite scroll
- Devtools integration
- Auto retries, query invalidation

```tsx
import { useQuery } from '@tanstack/react-query';

function Profile() {
  const { data, error, isLoading } = useQuery(['user'], () =>
    fetch('/api/user').then(res => res.json())
  );

  if (error) return <div>Error</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data.name}</div>;
}
```

------

## 🔹 Key Differences

| Feature             | SWR               | React Query  |
| ------------------- | ----------------- | ------------ |
| Complexity          | Simple            | More complex |
| Mutations           | No (external lib) | Built-in     |
| Pagination/Infinite | No built-in       | Built-in     |
| Devtools            | Basic             | Advanced     |
| Community           | Smaller           | Larger       |

------

## 🔹 When to Use

- Choose **SWR** for lightweight apps or when you want minimal setup
- Choose **React Query** for complex data needs: mutations, caching, pagination

------

## 🧪 Interview-style challenge

**Q:** Use React Query to fetch a list of posts and refetch on window focus.

```tsx
const { data, isLoading } = useQuery('posts', fetchPosts, {
  refetchOnWindowFocus: true,
});
```

