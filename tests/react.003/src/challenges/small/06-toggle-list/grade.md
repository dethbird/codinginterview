Great pace. Here’s a tight review for **Small 06 — Toggleable List**.

# Verdict

## ✅ What you did right

* Clean controlled state for the item checkboxes (`sel` array).
* “Select All” correctly toggles between all/none.
* Summary (`X of N selected`) updates correctly.
* Tests drive the main flows and are deterministic.

## ⚠️ What to improve (and why)

1. **`indeterminate` not set**
   The requirement says the master checkbox reflects the indeterminate state. You left a TODO but never set `masterRef.current.indeterminate`. Add a `useEffect` that sets it to `true` when `0 < sel.length < items.length`.

2. **Derived state should be derived**
   You keep `allChecked` in state and also derive it via `sel.length === items.length`. This can drift if anything ever updates one without the other. Prefer a computed value:

   ```js
   const allChecked = sel.length === items.length && items.length > 0
   ```

3. **Return a new array for “select all”**
   You return `items` directly. It’s fine here (strings), but better to return a **new** array (`items.slice()` or `[...items]`) to avoid referential surprises if `items` were ever mutated or memoized elsewhere.

4. **Tests don’t assert indeterminate**
   You check `!checked`, but the requirement calls for indeterminate. With `@testing-library/jest-dom`, you can use `toBePartiallyChecked()` (or assert `.indeterminate`).

---

# Golden solution (minimal changes, indeterminate done right)

```jsx
import React, { useEffect, useRef, useState } from 'react'

const defaultItems = ['Alpha', 'Beta', 'Gamma', 'Delta']

export default function ToggleList({ items = defaultItems }) {
  const [sel, setSel] = useState([])
  const masterRef = useRef(null)

  const allChecked = items.length > 0 && sel.length === items.length
  const noneChecked = sel.length === 0
  const someChecked = !noneChecked && !allChecked

  // Reflect indeterminate state on the master checkbox
  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = someChecked
    }
  }, [someChecked])

  const toggleAll = () => {
    setSel(allChecked ? [] : [...items])
  }

  const toggleOne = (label) => {
    setSel((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]))
  }

  return (
    <div>
      <label>
        <input
          ref={masterRef}
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
        />
        Select All
      </label>

      <ul>
        {items.map((l) => (
          <li key={l}>
            <label>
              <input
                type="checkbox"
                checked={sel.includes(l)}
                onChange={() => toggleOne(l)}
              />
              {l}
            </label>
          </li>
        ))}
      </ul>

      <div data-testid="summary">
        {sel.length} of {items.length} selected
      </div>
    </div>
  )
}
```

---

# Test upgrades (assert indeterminate)

You can keep your existing tests and add these two expectations:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToggleList from './index.jsx'

it('shows indeterminate on master when some (but not all) are selected', async () => {
  const user = userEvent.setup()
  render(<ToggleList items={['A', 'B', 'C']} />)

  const master = screen.getByLabelText(/Select All/)
  // select all
  await user.click(master)
  // deselect one -> indeterminate
  await user.click(screen.getByLabelText('B'))

  // Option 1 (jest-dom matcher)
  expect(master).toBePartiallyChecked()
  // Option 2 (property assertion)
  // expect(master.indeterminate).toBe(true)
})

it('clears indeterminate when toggling master after partial selection', async () => {
  const user = userEvent.setup()
  render(<ToggleList items={['A', 'B', 'C']} />)
  const master = screen.getByLabelText(/Select All/)

  // Make partial selection
  await user.click(screen.getByLabelText('A'))
  await user.click(screen.getByLabelText('B'))
  expect(master).toBePartiallyChecked()

  // Click master -> select all
  await user.click(master)
  expect(master).toBeChecked()

  // Click master -> select none
  await user.click(master)
  expect(master).not.toBeChecked()
  // expect(master.indeterminate).toBe(false)
})
```

---

## Final grade

* **Correctness:** 8/10 (core works; missing indeterminate)
* **A11y/UX polish:** 8.5/10 (with indeterminate set, this is solid)
* **Tests:** 8/10 (add explicit indeterminate checks)

If you want to push it further: handle `items` prop changes (filter `sel` to valid items) and add keyboard support (space/enter on master/item labels).
