Here’s a markdown page for `01-js-fundamentals/async-await-promises.md` — interview-oriented, React-relevant, and ready to paste into your notes:

------

### 📘 Async / Await / Promises (JS Fundamentals)

React apps often deal with APIs or async data (e.g. `fetch()`). Understanding promises and async/await is key for data fetching with `useEffect`.

------

## 🔹 What is a Promise?

A **Promise** is a placeholder for a value that will exist in the future.

```ts
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('done'), 1000);
});

promise.then(result => console.log(result)); // 'done'
```

------

## 🔹 `async` / `await`

`async` marks a function as returning a promise. Use `await` to pause until a promise resolves.

```ts
async function getData() {
  const res = await fetch('/api/user');
  const data = await res.json();
  console.log(data);
}
```

🧠 Think of `await` like “wait here until resolved.”

------

## 🔹 Try/Catch for Errors

Handle errors using `try/catch` inside `async` functions.

```ts
async function loadUser() {
  try {
    const res = await fetch('/user');
    const user = await res.json();
  } catch (err) {
    console.error('Fetch failed', err);
  }
}
```

🧠 Don't use `.catch()` with `await` — prefer `try/catch` for clarity.

------

## 🔹 Parallel Requests with `Promise.all`

Run multiple requests at once instead of waiting sequentially:

```ts
const [user, posts] = await Promise.all([
  fetch('/user').then(res => res.json()),
  fetch('/posts').then(res => res.json())
]);
```

------

## 🔹 Common Pitfall: top-level `await`

`await` can’t be used at the top level of a regular JS file — only inside `async` functions.

```ts
// ❌ SyntaxError
const data = await fetch('/api');
```

✅ Fix:

```ts
async function main() {
  const data = await fetch('/api');
}
main();
```

------

## 🧠 In React: useEffect with async

You **can’t** make `useEffect` itself `async` — instead define an inner function:

```tsx
useEffect(() => {
  const fetchData = async () => {
    const res = await fetch('/data');
    const json = await res.json();
    setData(json);
  };
  fetchData();
}, []);
```

------

## 🧪 Interview-style challenge

**Q: Fetch user data and posts in parallel, then return an object containing both.**

```ts
async function fetchUserAndPosts() {
  const [user, posts] = await Promise.all([
    fetch('/user').then(res => res.json()),
    fetch('/posts').then(res => res.json())
  ]);
  return { user, posts };
}
```

