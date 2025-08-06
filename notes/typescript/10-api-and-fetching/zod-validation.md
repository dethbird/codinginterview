# Zod Validation

## Overview

Zod is a TypeScript-first schema validation library that enables runtime data validation with static type inference.

------

## Defining Schemas

```ts
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});
```

------

## Validating Data

```ts
const result = userSchema.safeParse({
  id: 1,
  name: "Alice",
  email: "alice@example.com",
});

if (!result.success) {
  console.error(result.error.errors);
} else {
  console.log(result.data); // Typed as User inferred from schema
}
```

------

## Inferring Types

```ts
type User = z.infer<typeof userSchema>;
```

- Automatically infers TypeScript types from schemas.

------

## Integration Example with Fetch

```ts
async function fetchUser(userId: number): Promise<User> {
  const response = await fetch(`/users/${userId}`);
  const data = await response.json();

  const parsed = userSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid data");

  return parsed.data;
}
```

------

## Interview Tips

- Understand runtime validation with static type inference.
- Be able to define schemas and infer types.
- Explain advantages over manual validation or loose typing.

