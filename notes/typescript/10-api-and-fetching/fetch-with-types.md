# Fetch with Types

## Overview

When using the Fetch API in TypeScript, you can type the expected response data for safer parsing and usage.

------

## Typing Fetch Response

```ts
interface User {
  id: number;
  name: string;
}

async function fetchUser(userId: number): Promise<User> {
  const response = await fetch(`/users/${userId}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: User = await response.json();
  return data;
}
```

- Explicitly type the expected JSON response (`User`).
- Always check `response.ok` before parsing.

------

## Using Generics for Reusable Fetch

```ts
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Network error");
  }
  const data: T = await response.json();
  return data;
}

interface Post {
  id: number;
  title: string;
}

const post = await fetchJson<Post>("/posts/1");
```

- Generic function allows typing various endpoints.

------

## Error Handling

Fetch errors are not thrown for HTTP errors, so handle them manually as above.

------

## Interview Tips

- Know how to type parsed JSON responses.
- Understand how to write generic fetch wrappers.
- Always check response status before parsing.

