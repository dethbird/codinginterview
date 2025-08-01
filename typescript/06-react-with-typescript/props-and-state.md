# Props and State in React with TypeScript

## Overview

TypeScript helps type React components’ props and state for better safety and autocompletion.

------

## Typing Props in Functional Components

```tsx
type GreetingProps = {
  name: string;
  age?: number; // optional prop
};

function Greeting({ name, age }: GreetingProps) {
  return (
    <div>
      Hello, {name}! {age && `You are ${age} years old.`}
    </div>
  );
}
```

------

## Typing Props in Class Components

```tsx
import React from "react";

type GreetingProps = {
  name: string;
};

type GreetingState = {
  count: number;
};

class Greeting extends React.Component<GreetingProps, GreetingState> {
  state = { count: 0 };

  render() {
    return <div>Hello, {this.props.name}! Count: {this.state.count}</div>;
  }
}
```

------

## Typing State in Functional Components with Hooks

```tsx
import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState<number>(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

- TypeScript usually infers the state type from the initial value, but you can specify explicitly.

------

## Default Props

TypeScript supports default props via default parameters or `defaultProps` in class components.

------

## Interview Tips

- Know how to define and use prop types with interfaces or type aliases.
- Understand typing state in both class and functional components.
- Be comfortable with optional props and default values.

