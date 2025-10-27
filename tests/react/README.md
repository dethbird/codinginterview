# React Interview Practice

A time-boxed set of small (≤30 min) and medium (≤60 min) React challenges with a Vite + Vitest setup.

## Quickstart
```bash
npm i
npm run dev
# visit the URL, then select a challenge from the dropdown
npm test
```

## How it works
- This app dynamically loads a challenge component based on selection (or `?challenge=small-01-counter`).
- Each challenge lives under `src/challenges/<tier>/<slug>/` with:
  - `index.jsx` (starter component with TODOs)
  - `README.md` (prompt + acceptance criteria)
  - `index.test.jsx` (suggested tests; some prefilled)
- Add your solutions directly in the challenge `index.jsx` and run tests with `npm test`.

## Timer tip
- Small: spend 20 min for MVP + 10 min for polish.
- Medium: 45 min MVP + 15 min polish/tests.
