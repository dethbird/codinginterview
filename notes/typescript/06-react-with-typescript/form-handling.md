# Form Handling in React with TypeScript

## Overview

Typing forms in React helps catch errors early and ensures type safety when working with form inputs and events.

------

## Typing Controlled Inputs

```tsx
import React, { useState } from "react";

function NameForm() {
  const [name, setName] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <input type="text" value={name} onChange={handleChange} />
  );
}
```

- Use `React.ChangeEvent<HTMLInputElement>` for typing event parameter.
- State should have the appropriate type (`string` here).

------

## Typing Form Submit Handler

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // form processing logic
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form inputs */}
    </form>
  );
}
```

------

## Using `useRef` for Uncontrolled Inputs

```tsx
import React, { useRef } from "react";

function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (inputRef.current) {
      alert(inputRef.current.value);
    }
  };

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>Show Value</button>
    </>
  );
}
```

------

## Interview Tips

- Know how to type input change and form submit events.
- Understand controlled vs uncontrolled components.
- Be comfortable using refs with forms.

