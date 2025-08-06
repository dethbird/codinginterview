# useRef and useEffect with TypeScript

## Overview

`useRef` and `useEffect` are React hooks often used with TypeScript for managing references and side effects with typed safety.

------

## Typing `useRef`

- `useRef` creates a mutable reference that persists across renders.
- To type it correctly, you can specify the ref type.

### Example: DOM Element Ref

```tsx
import React, { useRef, useEffect } from "react";

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

- Initial value is usually `null`.
- You must check for `null` before using the ref.

------

## Typing `useRef` for Mutable Values

```tsx
const countRef = useRef<number>(0);

function increment() {
  countRef.current += 1;
}
```

- `useRef` can hold any mutable value, not just DOM nodes.

------

## Typing `useEffect`

- `useEffect` callback doesn’t require specific typing, but the dependency array should be carefully managed.
- Clean-up function types:

```tsx
useEffect(() => {
  const id = setInterval(() => console.log("tick"), 1000);

  return () => clearInterval(id); // Cleanup
}, []);
```

------

## Interview Tips

- Know how to type `useRef` for DOM elements and other values.
- Understand nullability of refs.
- Be familiar with typing effects and cleanup functions.

