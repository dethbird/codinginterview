# React Testing Library

## Overview

React Testing Library (RTL) focuses on testing React components by simulating user interactions and asserting on rendered output rather than implementation details.

------

## Basic Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByText(/click me/i));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

------

## Key Functions

- `render`: Render the component into a virtual DOM.
- `screen`: Access elements using queries like `getByText`, `getByRole`.
- `fireEvent`: Simulate user events (click, change, submit, etc).

------

## Typing with TypeScript

- RTL provides its own types, compatible with TypeScript.
- Use appropriate typing for event handlers and async tests.

```tsx
import { fireEvent } from '@testing-library/react';

fireEvent.change(inputElement, { target: { value: 'hello' } });
```

------

## Async Testing

```tsx
import { waitFor } from '@testing-library/react';

await waitFor(() => expect(fetchMock).toHaveBeenCalled());
```

------

## Interview Tips

- Focus on testing component behavior from user perspective.
- Use RTL queries for accessibility-friendly testing.
- Know how to type event handlers and async tests in TypeScript.

