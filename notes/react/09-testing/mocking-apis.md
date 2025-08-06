### 📘 Mocking APIs in Tests

Mocking API calls helps you isolate components and test their behavior without real network requests.

------

## 🔹 Why Mock APIs?

- Avoid flaky tests caused by network
- Control API responses for different scenarios
- Speed up test suite execution

------

## 🔹 Tools for Mocking

- **Jest mocks** (built-in)
- **MSW (Mock Service Worker)** — intercepts real network calls in tests or dev
- **Axios mocks** (if you use axios)

------

## 🔹 Jest Mock Example (fetch)

```ts
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked data' }),
  })
) as jest.Mock;
```

In your test:

```tsx
test('fetches and displays data', async () => {
  render(<MyComponent />);
  expect(fetch).toHaveBeenCalledWith('/api/data');

  const resolvedData = await screen.findByText('mocked data');
  expect(resolvedData).toBeInTheDocument();
});
```

------

## 🔹 Using MSW

MSW intercepts requests on the network level for realistic mocks.

```ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked data' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

------

## 🔹 Mocking axios with Jest

```ts
jest.mock('axios');
import axios from 'axios';

axios.get.mockResolvedValue({ data: { id: 1 } });
```

------

## 🔹 Tips

- Reset mocks after each test to avoid leakage
- Use MSW for integration/e2e tests for realism
- Keep API mock data small and relevant

------

## 🧪 Interview-style challenge

**Q:** Write a test for a component that fetches user data and handles error state when fetch fails.

