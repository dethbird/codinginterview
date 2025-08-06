# Error Boundaries

## Overview

Error boundaries are React components that catch JavaScript errors in their child component tree and display a fallback UI instead of crashing the whole app.

------

## Creating an Error Boundary Component

Error boundaries must be class components that implement `componentDidCatch` and `getDerivedStateFromError`.

```tsx
import React from "react";

type State = { hasError: boolean };

class ErrorBoundary extends React.Component<{}, State> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

------

## Usage

Wrap parts of your app with the error boundary:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

------

## TypeScript Tips

- State and props types should be typed explicitly.
- `componentDidCatch` receives `Error` and `React.ErrorInfo`.
- `getDerivedStateFromError` is a static method.

------

## Interview Tips

- Understand why error boundaries are used.
- Know which lifecycle methods to implement.
- Recognize that only class components can be error boundaries (for now).

------

Ready for **never-type.md**?Error Boundaries

## Overview

Error boundaries are React components that catch JavaScript errors in their child component tree and display a fallback UI instead of crashing the whole app.

------

## Creating an Error Boundary Component

Error boundaries must be class components that implement `componentDidCatch` and `getDerivedStateFromError`.

```tsx
import React from "react";

type State = { hasError: boolean };

class ErrorBoundary extends React.Component<{}, State> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

------

## Usage

Wrap parts of your app with the error boundary:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

------

## TypeScript Tips

- State and props types should be typed explicitly.
- `componentDidCatch` receives `Error` and `React.ErrorInfo`.
- `getDerivedStateFromError` is a static method.

------

## Interview Tips

- Understand why error boundaries are used.
- Know which lifecycle methods to implement.
- Recognize that only class components can be error boundaries (for now).

