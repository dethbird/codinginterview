# Jest Types

## Overview

Using Jest with TypeScript improves test reliability and developer experience by typing test functions, mocks, and assertions.

------

## Basic Test Typing

```ts
test("adds numbers", () => {
  expect(1 + 2).toBe(3);
});
```

- Jest functions like `test`, `describe`, `expect` are typed out of the box with `@types/jest`.

------

## Typing Mock Functions

```ts
const mockFn = jest.fn<(a: number, b: number) => number>();

mockFn.mockImplementation((a, b) => a + b);

expect(mockFn(1, 2)).toBe(3);
```

- You can provide explicit types for mocks to ensure correct call signatures.

------

## Typing Asynchronous Tests

```ts
test("fetches data", async () => {
  const data = await fetchData();
  expect(data).toHaveProperty("id");
});
```

- Async tests return promises and use `async/await`.

------

## Using `@types/jest`

- Ensure you have `@types/jest` installed for TypeScript support:

```bash
npm install --save-dev @types/jest
```

------

## Interview Tips

- Know how to write typed tests with Jest.
- Understand typing mocks and async tests.
- Familiarity with Jest typings is a plus in interviews.

