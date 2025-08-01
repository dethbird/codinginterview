# Axios Types

## Overview

When using Axios with TypeScript, typing request and response data enhances type safety and developer experience.

------

## Typing Axios Response

```ts
import axios from "axios";

interface User {
  id: number;
  name: string;
}

async function getUser(userId: number): Promise<User> {
  const response = await axios.get<User>(`/users/${userId}`);
  return response.data;
}
```

- Use generics to specify response data type (`axios.get<User>`).
- `response.data` is typed as `User`.

------

## Typing Axios Request Body

```ts
interface NewUser {
  name: string;
  email: string;
}

async function createUser(user: NewUser): Promise<User> {
  const response = await axios.post<User>("/users", user);
  return response.data;
}
```

- The request body type is inferred from the function parameter.

------

## Axios Error Typing

```ts
import { AxiosError } from "axios";

try {
  await axios.get<User>("/invalid-url");
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(error.response?.status);
  }
}
```

- Use `axios.isAxiosError` to narrow error type safely.

------

## Interview Tips

- Know how to type Axios response and request payloads.
- Understand error handling and type narrowing for Axios errors.
- Use generics effectively with Axios methods.

