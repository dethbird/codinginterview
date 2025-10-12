Nice—Series C usually means “we ship fast, we scale now.” Expect interviews that balance **hands-on React work**, **pragmatic architecture decisions**, and **signal on DX/performance/testing**. Here’s a tight prep kit tuned for that stage.

# What they’re likely to probe

**React + Hooks depth**

1.  “Walk me through what triggers a re-render. Show how you’d prevent a child from re-rendering when props are stable.”
* “Common `useEffect` footguns? How do you fix a stale closure?”
* “When would you use `useMemo` vs `React.memo` vs `useCallback`? When *wouldn’t* you?”

**State & data fetching**

* “Local vs global state: what belongs where? Compare Context, Redux Toolkit, Zustand, TanStack Query.”
* “How do you model server cache vs client state? Why not keep everything in Redux?”
* “How do Suspense and `use` (React 19) change your data-fetching approach?”

**Performance & UX**

* “Diagnose a slow list. What tools and steps do you take?”
* “Implement input debouncing and explain tradeoffs vs throttling.”
* “How do you approach code-splitting and route-level prefetching?”

**Architecture & scale**

* “How to organize a growing component/hook library? Avoid prop-drilling without over-engineering.”
* “Design a feature flag system in the client. Where do types live? How do you test fallbacks?”
* “Dark mode + theming at scale: CSS variables vs CSS-in-JS vs Tailwind tokens.”

**Reliability & testing**

* “Write a test for a component that fetches and paginates. What do you mock vs not?”
* “E2E vs unit vs integration: where’s the ROI line?”
* “What’s your strategy to keep types, tests, and runtime behavior aligned?”

**Accessibility & product sense**

* “Build an accessible combobox or modal. What ARIA roles are essential?”
* “How do you measure UX quality beyond Lighthouse (RUM, Core Web Vitals, Sentry/LogRocket)?”

---

# Realistic 30–45 min live coding prompt (Series C style)

**Prompt:**
Build a **searchable, paginated User Directory**.

**Requirements**

1. Fetch users from `GET /users?page=<n>&q=<string>` (you’ll mock it with a local async function).
2. Show a search input with **debounce (300ms)**.
3. Show a list (name, email). Highlight the **matched substring** in the name.
4. Client-side **pagination** (Next/Prev). Disable buttons appropriately.
5. Loading and error states; retry on error.
6. Preserve search + page in the **URL** (`/directory?q=ana&page=3`).
7. Prevent unnecessary re-renders (memoize list rows).

**Stretch (if time)**

* Keyboard nav: ↑/↓ selects a row; Enter opens a detail panel.
* Infinite scroll instead of buttons (explain how you’d swap).
* Add a simple `useUsers` hook that encapsulates fetching, caching, and cancelation (AbortController).

**What the interviewer is watching for**

* Clean component boundaries (`DirectoryPage` → `SearchBar`, `UserList`, `Pagination`).
* Stable props for children (use `useMemo` for derived lists; `useCallback` for handlers).
* URL state with `useSearchParams` or a tiny `useQueryState` hook.
* Debounce implemented without leaks (cleanup on unmount / query change).
* Accessible markup (roles, labels, button states).

**Skeleton you can keep in your head**

```tsx
function DirectoryPage() {
  const [params, setParams] = useQueryState({ q: '', page: 1 });
  const debouncedQ = useDebouncedValue(params.q, 300);
  const { data, loading, error, retry } = useUsers({ page: params.page, q: debouncedQ });

  const rows = useMemo(() => data?.users ?? [], [data]);
  const onSearch = useCallback((q: string) => setParams({ q, page: 1 }), [setParams]);

  return (
    <>
      <SearchBar value={params.q} onChange={onSearch} />
      {loading && <Spinner />}
      {error && <ErrorView onRetry={retry} />}
      <UserList users={rows} query={debouncedQ} />
      <Pagination
        page={params.page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={(p) => setParams({ page: p })}
      />
    </>
  );
}
```

**Tiny test targets (React Testing Library)**

* Debounce: type “ana” and `await waitFor` that fetch called once after 300ms.
* Highlighting: assert that only matched spans get a `<mark>` (or class).
* Pagination: clicking Next updates the URL and triggers fetch.
* Memoization: spy on `UserRow` render count with a test-only wrapper.

---

# Lightning theory answers (sound senior without rambling)

* **Re-renders:** A component re-renders when its state changes, its parent re-renders and passes new props (by *identity*), or a context value it consumes changes. Prevent waste by stabilizing callback/objects, splitting components, and memoizing *when* it’s actually hot.
* **`useEffect` pitfalls:** Missing deps causes stale closures; over-eager deps cause loops. Fix with correct deps, functional `setState`, or `useRef` for mutable values that shouldn’t trigger renders.
* **Memo tools:**
  `React.memo`: skip child re-render if prop equality holds.
  `useMemo`: cache expensive derived values.
  `useCallback`: stabilize handler identity for children that care (lists, memoized children).
  Don’t blanket-apply; profile first.
* **Client vs server state:** Server cache (TanStack Query/SWR) is **remote truth with staleness**, retries, background refresh. Client state is **session UI state** (dialogs, filters). Mixing them in one store hurts correctness and perf.
* **SSR/SSG/CSR & hydration:** SSR returns HTML + a data-hydrated app; CSR renders on client only; SSG prebuilds at deploy time. Series C cares about **TTFB, LCP, and route-based code-splitting**—pick the mode per page.
* **Error boundaries:** Catch render/commit errors below a tree; they don’t catch async in event handlers. Pair with logging and per-route boundaries.

---

# A minimal “coding test or theoretical?” answer you can use live

> “I’ve seen both. For frontend-heavy roles at growth-stage companies, I usually see a small React build with data fetching, URL state, and a performance angle—something like a searchable list with pagination—plus a short discussion on state, effects, memoization, and testing strategy. I’m comfortable with either; if it’s hands-on, I’ll keep components small, stabilize props for child lists, and verify rendering with RTL; if it’s theoretical, I’ll focus on the mental model of renders, effects, and cache vs UI state.”

---

# One-hour practice plan (tight loop)

1. **15 min** – Implement `useDebouncedValue`, URL state, and a small `useUsers` with abortable fetch.
2. **15 min** – List + Pagination + error states; lock buttons correctly.
3. **10 min** – Memoize `UserRow`, highlight matches; confirm renders in console.
4. **10 min** – Add two RTL tests (debounce, pagination).
5. **10 min** – Micro-perf: lazy-load detail panel, ensure no extra renders on type.

---

# Quick checklist before the interview

* TanStack Query basics (staleTime, cacheTime, queryKeys, optimistic updates).
* React 18/19 quirks: concurrent rendering, transitions, Suspense for data, `startTransition`.
* A11y for inputs, lists, modals; keyboard focus management.
* Core Web Vitals knobs: image priority, prefetching, bundle splitting, hydration cost awareness.
* Testing: RTL patterns, MSW for network, Playwright/Cypress for 1–2 e2e flows.

If you want, I can spin up a mini repo outline (components, hooks, tests) matching that prompt so you can run it locally and drill it before the call.
