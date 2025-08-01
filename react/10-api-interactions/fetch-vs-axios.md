### 📘 Fetch vs Axios (API Interactions)

Both are popular for making HTTP requests in React apps. Knowing when to use each is valuable.

------

## 🔹 Fetch API (built-in browser API)

```ts
fetch('/api/data')
  .then(res => {
    if (!res.ok) throw new Error('Network error');
    return res.json();
  })
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Pros

- Built into browsers, no installation needed
- Flexible and standards-compliant
- Supports streaming, request cancellation via AbortController

### Cons

- No automatic JSON parsing errors handling
- No automatic request/response interceptors
- Verbose error handling

------

## 🔹 Axios (third-party library)

```ts
import axios from 'axios';

axios.get('/api/data')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

### Pros

- Automatic JSON parsing
- Supports interceptors for requests/responses
- Supports older browsers
- Built-in request cancellation
- Supports timeout, transforms, and more options

### Cons

- Adds a dependency and bundle size
- Slightly less flexible than raw fetch for advanced streaming

------

## 🔹 Error Handling Differences

- Fetch only rejects on network failure, not HTTP error status
- Axios rejects promises on HTTP errors (status codes outside 2xx)

------

## 🔹 When to Use Which?

| Criteria             | Fetch                | Axios                 |
| -------------------- | -------------------- | --------------------- |
| Built-in             | Yes                  | No                    |
| JSON parsing         | Manual               | Automatic             |
| Interceptors support | No                   | Yes                   |
| Request cancellation | AbortController      | Cancel tokens         |
| Browser support      | Modern browsers only | Older browser support |
| Bundle size          | 0 (native)           | Adds to bundle size   |

------

## 🧪 Interview-style challenge

**Q:** Write a function using Fetch that returns JSON or throws on HTTP errors.

```ts
async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}
```

