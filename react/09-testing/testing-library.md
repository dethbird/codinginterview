### 📘 React Testing Library (RTL)

RTL encourages testing React components the way users interact with them — focusing on behavior rather than implementation details.

------

## 🔹 Installation

```bash
npm install --save-dev @testing-library/react
```

------

## 🔹 Basic Usage

Render a component and query its elements:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyButton from './MyButton';

test('button click increments count', async () => {
  render(<MyButton />);
  const button = screen.getByRole('button', { name: /click me/i });
  
  await userEvent.click(button);
  
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});
```

------

## 🔹 Queries

- `getBy...` — throws if not found (use for elements that must be present)
- `queryBy...` — returns null if not found (use for elements that might not exist)
- `findBy...` — async, waits for element to appear

Common queries:

- `getByRole` — preferred for accessibility
- `getByLabelText` — for inputs
- `getByText` — for visible text

------

## 🔹 User Events

`userEvent` simulates real user interactions like typing and clicking.

```tsx
await userEvent.type(input, 'hello');
await userEvent.click(button);
```

------

## 🔹 Async Testing

Use async `findBy...` or `waitFor` to test async UI changes.

```tsx
import { waitFor } from '@testing-library/react';

await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());
```

------

## 🔹 Cleanup

RTL auto-cleans DOM after each test, no manual cleanup needed.

------

## 🔹 Best Practices

- Test **behavior**, not implementation
- Prefer queries that reflect what users see (roles, labels)
- Avoid querying by test IDs unless necessary
- Write tests that are resilient to UI changes

------

## 🧪 Interview-style challenge

**Q:** Write a test for a `<LoginForm />` that submits with username and password and shows an error if either is empty.