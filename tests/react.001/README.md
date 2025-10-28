Perfect — here’s an updated version of your README that keeps your run instructions, adds clarity about the **test-driven workflow**, and emphasizes that challenges are **partially implemented** (not full answers):

------

# React Interview Practice

A time-boxed set of small (≤30 min) and medium (≤60 min) React challenges with a Vite + Vitest setup.

## Quickstart

```bash
npm i
npm run dev -- --host 0.0.0.0
# Local:   http://localhost:5173/
# Network: http://10.0.2.15:5173/   # (example)
# Visit the URL in your browser, then select a challenge from the dropdown.
npm test
# single test:
npx vitest watch src/challenges/small/02-char-count/*
```

## How it works

- This app dynamically loads a challenge component based on selection (or by URL param, e.g. `?challenge=small-01-counter`).
- Each challenge lives under `src/challenges/<tier>/<slug>/` and contains:
  - `README.md` — the **prompt** with acceptance criteria
  - `index.jsx` — a **starter component** with partial logic and `// TODO` notes
  - `index.test.jsx` — **tests** describing expected behavior (some already passing, some failing)

Your goal: **fill in or correct `index.jsx` until all tests pass.**

The provided code runs out of the box so you can jump straight into implementing logic instead of wiring setup.
 Tests act as your interviewer—they describe what’s missing.

### Example workflow

1. Pick a challenge in the UI or go directly to a URL like
    `http://localhost:5173/?challenge=small-04-fetch-users`

2. Open its folder:
    `src/challenges/small/04-fetch-users/`

3. Read `README.md` for the prompt.

4. Run tests:

   ```bash
   npm run test:watch
   ```

5. Implement logic in `index.jsx` until all specs pass.

6. Refactor for readability or bonus points once green.

## Timer tip

- **Small:** ~20 min for MVP + 10 min for polish
- **Medium:** ~45 min for MVP + 15 min for tests/refactor

------

Would you like me to include a short **“Common Gotchas”** section at the end (e.g., how to mock fetch, how to debug with Vitest, etc.)? It fits nicely after this.



# Testing

Yes — and you *definitely should*! 👏
 Vitest makes it easy to focus on just **one challenge’s tests** instead of running the whole suite every time.

Here are a few great ways to do it:

------

## 🧪 Option 1 — Run tests for a specific file

From your project root:

```bash
npx vitest run src/challenges/small/04-fetch-users/index.test.jsx
```

That will **only** run that one test file.

> 💡 Tip: you can use partial paths or globs:
>
> ```bash
> npx vitest run src/challenges/small/04*
> ```
>
> runs all “small-04” tests.

------

## 🔁 Option 2 — Watch mode for a single challenge

Run Vitest in watch mode, but filtered to a specific test file or pattern:

```bash
npx vitest watch src/challenges/small/04-fetch-users
```

Now Vitest will re-run just that file whenever you edit it.
 (You’ll see the fast “watch” UI refresh after every save.)

------

## 🧭 Option 3 — Use a name filter

If you want to run just one test or describe block:

```bash
npx vitest watch -t "fetches users"
```

The `-t` (or `--testNamePattern`) flag matches any test name substring — super handy once you’re narrowing down an issue.

------

## 🧰 Bonus: Add shortcuts to `package.json`

Add these to your scripts section:

```json
"scripts": {
  "test": "vitest --watch=false",
  "test:watch": "vitest",
  "test:one": "vitest run",
  "test:watch:one": "vitest watch"
}
```

Then you can do:

```bash
npm run test:one src/challenges/small/04-fetch-users
```

or

```bash
npm run test:watch:one src/challenges/small/04-fetch-users
```

------

## 🧩 TL;DR

| Goal              | Command                                                |
| ----------------- | ------------------------------------------------------ |
| Run one file once | `npx vitest run src/challenges/small/04-fetch-users`   |
| Watch one file    | `npx vitest watch src/challenges/small/04-fetch-users` |
| Run one test name | `npx vitest -t "fetches users"`                        |

