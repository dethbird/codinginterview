# Mocking Fetch

## Overview

Mocking the `fetch` API in tests allows you to simulate network responses and test your code in isolation.

------

## Using Jest to Mock Fetch

### Basic Mock Setup

```ts
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: "mocked data" }),
  })
) as jest.Mock;
```

------

## Example Test with Mocked Fetch

```ts
test("fetches data correctly", async () => {
  const response = await fetch("/api/data");
  const data = await response.json();

  expect(data).toEqual({ data: "mocked data" });
  expect(fetch).toHaveBeenCalledWith("/api/data");
});
```

------

## Using `jest-fetch-mock`

For more advanced mocking, use `jest-fetch-mock` library:

```bash
npm install --save-dev jest-fetch-mock
import fetchMock from "jest-fetch-mock";

fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

test("fetch call", async () => {
  fetchMock.mockResponseOnce(JSON.stringify({ data: "12345" }));

  const res = await fetch("/some-url");
  const json = await res.json();

  expect(json.data).toBe("12345");
});
```

------

## Interview Tips

- Be able to mock global `fetch` in Jest.
- Know how to simulate different responses and errors.
- Understand why mocking fetch is important for isolated testing.

