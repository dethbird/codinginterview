# Typing Events in React with TypeScript

## Overview

Typing event handlers in React with TypeScript ensures proper type safety and better developer experience.

------

## Common Event Types

- React provides synthetic event types that wrap native DOM events:

| Event Type          | React Type               |
| ------------------- | ------------------------ |
| Form events         | `React.FormEvent<T>`     |
| Input change events | `React.ChangeEvent<T>`   |
| Mouse events        | `React.MouseEvent<T>`    |
| Keyboard events     | `React.KeyboardEvent<T>` |
| Focus events        | `React.FocusEvent<T>`    |

`T` is typically an HTML element like `HTMLInputElement`.

------

## Typing Event Handlers

```tsx
function TextInput() {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
  };

  return <input type="text" onChange={handleChange} />;
}
```

------

## Event Handler Props

```tsx
type ButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

function Button({ onClick }: ButtonProps) {
  return <button onClick={onClick}>Click me</button>;
}
```

------

## Prevent Default and Stop Propagation

Events have methods like `preventDefault()` and `stopPropagation()`, accessible on the typed event.

```tsx
function Form() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted");
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

------

## Interview Tips

- Be familiar with common React synthetic event types.
- Know how to type event handlers and event props.
- Understand how to access event properties safely.

