### 📘 Component Types (Function vs Class)

React components come in two main flavors:

- **Function components** (modern standard)
- **Class components** (legacy, but still seen in codebases/interviews)

------

## 🔹 Function Components (✅ preferred)

```tsx
function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

Or with arrow syntax:

```tsx
const Welcome = ({ name }: { name: string }) => (
  <h1>Hello, {name}</h1>
);
```

### ✅ Key features:

- Use **React Hooks** (`useState`, `useEffect`, etc.)
- Shorter, easier to test
- Now the **default** in all modern React code

------

## 🔹 Class Components (📦 legacy)

```tsx
import React, { Component } from 'react';

class Welcome extends Component<{ name: string }> {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

### ⚠️ Why still relevant:

- You might need to refactor legacy code
- Some interviewers test class lifecycle methods

------

## 🔸 Major Differences

| Feature        | Function Component | Class Component                 |
| -------------- | ------------------ | ------------------------------- |
| State          | `useState()`       | `this.state`, `this.setState()` |
| Lifecycle      | `useEffect()`      | `componentDidMount`, etc.       |
| `this` keyword | ❌ not needed       | ✅ required                      |
| Hooks support  | ✅ yes              | ❌ no                            |
| Boilerplate    | ✅ minimal          | ❌ verbose                       |

------

## 🧠 Best Practices

✅ Use **function components** with hooks for new code
 ⛔ Avoid writing new class components unless required

------

## 🧪 Interview-style challenge

**Q: Convert this class to a function component with hooks:**

```tsx
class Counter extends React.Component {
  state = { count: 0 };
  render() {
    return (
      <button onClick={() => this.setState({ count: this.state.count + 1 })}>
        Count: {this.state.count}
      </button>
    );
  }
}
```

✅ Refactored:

```tsx
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
};
```