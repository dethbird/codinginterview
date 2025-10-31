NOTES

[ ] onclick handlers on next/prev
[ ] basic blocks for each section, next/prev should navigate
[ ] if next to last section, button becomes submit
[ ] run validator before each section change (put in useEffect setter)
[ ] a global state with items per section (useReducer?)
[ ] if state is submitted, show submission contents in main section (obfuscate password)


--- 

Short answer: your plan is solid. You can ship this with plain `useState`, but a tiny `useReducer` will make the navigation+validation flow cleaner and harder to break once you add more rules.

Here’s how I’d think about it (no full solution—just structure so you can build it):

# Does `useReducer` make sense?

* **Yes** when you have:

  * multiple fields across steps,
  * guards (can’t go Next with errors),
  * a submit mode that swaps the UI,
  * and a few “events” (update field, next, prev, submit).
* It centralizes transitions and keeps you from sprinkling validation state across effects.

# Minimal reducer shape (conceptual)

* **State**

  * `step: 0 | 1 | 2`
  * `data: { email, password, name, city }`
  * `errors: Record<string,string>` (only for current step)
  * `submitted: boolean`
* **Actions**

  * `update(patch)` – merge into `data`
  * `setErrors(errors)` – store latest validation for current step
  * `next` / `prev` – move step (caller should block if errors)
  * `submit` – toggle `submitted: true`

# Validation model

* `validate(data, step) -> errors`

  * Step 0 (Account): email format + password length
  * Step 1 (Profile): name/city required
  * Step 2 (Confirm): usually none
* **When to run it**

  * On each input change (so errors show live), and
  * Right before `next`/`submit` (guard).
* Avoid heavy `useEffect` chains; a simple `useEffect(() => dispatch(setErrors(validate(...))) , [data, step])` is enough. The button handlers still do a last-mile validate gate.

# UI flow (your checklist mapped)

* [x] **basic blocks**: render section by `step` (Account → Profile → Confirm).
* [x] **next/prev handlers**:

  * `onPrev`: `dispatch({ type: 'prev' })`
  * `onNext`: `const e = validate(...); if (!e.len) dispatch({ type:'next' }) else dispatch({type:'setErrors', errors:e})`
* [x] **submit on last**: `isLast = step === 2` → button label `Next` vs `Submit`.
* [x] **global state**: reducer holds everything; inputs dispatch `update({ field })`.
* [x] **submitted view**: if `submitted`, render payload (password obfuscated).
* [x] **accessibility**: use `aria-label` or `<label htmlFor>` so tests/querying are clean; show errors with `role="alert"`.

# Pitfalls to avoid

* Don’t run `next` and `setErrors` in the same tick without guarding; validate **first**, then decide to advance.
* Keep **errors only for the current step**; otherwise you’ll block Next due to fields not yet shown.
* Disable `Prev` on step 0; don’t allow `Next` if errors exist.
* Mask password in confirm & submitted views (don’t rely on `<input type="password">` alone).

# Lightweight test plan (so you know you’re done)

1. **Step 0 blocks on invalid**: click Next → still on step 0, alerts visible.
2. **Step 0 valid → step 1**: fill email/password → Next advances.
3. **Step 1 blocks until filled**: then Next → step 2.
4. **Step 2 shows Submit**: clicking Submit flips to “Submitted!” + payload with masked password.
5. **Prev works**: step 1 → Prev → step 0.
6. **Edits re-validate**: clearing a required field re-shows errors.

If you implement along those lines, `useReducer` will feel natural here. Want me to glance at your first pass once you wire the reducer and handlers?
