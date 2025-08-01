# Children and Generics in React with TypeScript

## Overview

Typing `children` and using generics improves flexibility and type safety in React components.

------

## Typing `children` Prop

- Use `React.ReactNode` for general-purpose children typing:

```tsx
type WrapperProps = {
  children: React.ReactNode;
};

function Wrapper({ children }: WrapperProps) {
  return <div>{children}</div>;
}
```

- This covers strings, elements, arrays, fragments, etc.

------

## Using Generics for Flexible Components

Generic components accept a type parameter to define prop types dynamically.

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}

// Usage:
<List
  items={[1, 2, 3]}
  renderItem={(item) => <li key={item}>{item}</li>}
/>
```

------

## Generic Forwarding Ref Example

```tsx
import React, { forwardRef } from "react";

type InputProps<T> = {
  value: T;
  onChange: (value: T) => void;
};

const Input = forwardRef<HTMLInputElement, InputProps<string>>(
  ({ value, onChange }, ref) => (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
);
```

------

## Interview Tips

- Use `React.ReactNode` for children.
- Know how to write generic components and use type parameters.
- Understand how generics improve component reusability.

