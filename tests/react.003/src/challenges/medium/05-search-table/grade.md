You’re in great shape here—this meets the spec and feels snappy. A few polish items will make it “interview perfect.”

# Verdict

## ✅ What you did well

* **Sorting UX**: click toggles asc/desc; switching columns resets to asc. Nice.
* **Filtering**: case-insensitive and trims input.
* **Type-safe sort**: numbers vs strings handled correctly.
* **Active column styles**: `.is-active` and a visible indicator in header.

## ⚠️ What to tighten up

1. **Spec mismatch (tiny):** prompt says “Search box filters by **name/email**.” You also filter on `age`. Not wrong, but call it out or stick to the spec.
2. **ARIA semantics:** add `aria-sort="ascending|descending|none"` on the **active column header** for SRs.
3. **Indicator consistency:** you render `👇` for `asc` (named `dir-up`) and `👆` for `desc` (named `dir-down`). That’s inverted/confusing. Use ↑/↓ (or ▲/▼) and align names.
4. **Perf/clarity nits:**

   * Compute `qNorm = q.trim().toLowerCase()` once.
   * Don’t call `.trim().toLowerCase()` on every cell each render.
   * You import `useEffect` but don’t use it—drop it.
   * Use `===` in `sort.dir === 'asc'` (you used `==` in one place).

## Test notes

Your test is good. Consider adding:

* Sorting **ascending** sanity (first click).
* **Switch column** resets to ascending.
* **aria-sort** is set on active column.
* Filtering respects **name/email only** if you revert to spec.

---

# Golden (polished, minimal diff)

```jsx
import React, { useState } from 'react'
import cn from 'classnames'

const sample = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
  { id: 2, name: 'Bob',   email: 'bob@example.com',   age: 35 },
  { id: 3, name: 'Cara',  email: 'cara@example.com',  age: 22 },
]

export default function SearchTable({ rows = sample }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' }) // dir: 'asc' | 'desc'

  const handleSort = (key) => {
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  const indicator = (key) => {
    if (key !== sort.key) return null
    return sort.dir === 'asc'
      ? <span aria-hidden data-testid="dir-up">↑</span>
      : <span aria-hidden data-testid="dir-down">↓</span>
  }

  const qNorm = q.trim().toLowerCase()

  // Per spec: filter by name/email (drop age; or keep if you prefer)
  const filtered = rows.filter(r =>
    !qNorm ||
    r.name.toLowerCase().includes(qNorm) ||
    r.email.toLowerCase().includes(qNorm)
  )

  const sorted = filtered.slice().sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    const va = a[sort.key]
    const vb = b[sort.key]
    return (typeof va === 'number' && typeof vb === 'number')
      ? (va - vb) * dir
      : String(va).localeCompare(String(vb)) * dir
  })

  const ariaSortFor = (key) =>
    key !== sort.key ? 'none' : (sort.dir === 'asc' ? 'ascending' : 'descending')

  return (
    <div>
      <input
        className="input"
        aria-label="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search name or email…"
      />

      <table className="table">
        <thead>
          <tr>
            <th aria-sort={ariaSortFor('name')}>
              <button
                className={cn('button', { 'is-active': sort.key === 'name' })}
                onClick={() => handleSort('name')}
              >
                Name {indicator('name')}
              </button>
            </th>
            <th aria-sort={ariaSortFor('email')}>
              <button
                className={cn('button', { 'is-active': sort.key === 'email' })}
                onClick={() => handleSort('email')}
              >
                Email {indicator('email')}
              </button>
            </th>
            <th aria-sort={ariaSortFor('age')}>
              <button
                className={cn('button', { 'is-active': sort.key === 'age' })}
                onClick={() => handleSort('age')}
              >
                Age {indicator('age')}
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          {sorted.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.email}</td>
              <td>{r.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Bonus test ideas

```jsx
it('sets aria-sort and toggles direction', async () => {
  const user = userEvent.setup()
  render(<SearchTable />)

  const ageBtn = screen.getByRole('button', { name: /Age/i })
  await user.click(ageBtn) // asc
  expect(screen.getByRole('columnheader', { name: /Age/i })).toHaveAttribute('aria-sort', 'ascending')
  expect(screen.getByTestId('dir-up')).toBeInTheDocument()

  await user.click(ageBtn) // desc
  expect(screen.getByRole('columnheader', { name: /Age/i })).toHaveAttribute('aria-sort', 'descending')
  expect(screen.getByTestId('dir-down')).toBeInTheDocument()
})

it('switching columns resets to ascending', async () => {
  const user = userEvent.setup()
  render(<SearchTable />)
  await user.click(screen.getByRole('button', { name: /Age/i }))  // asc
  await user.click(screen.getByRole('button', { name: /Name/i })) // switch
  expect(screen.getByRole('columnheader', { name: /Name/i })).toHaveAttribute('aria-sort', 'ascending')
})
```

## Score

* **Correctness:** 9/10 (meets behavior; tiny spec mismatch if you keep age in filter)
* **Accessibility:** 8.5/10 (add `aria-sort`; align indicators)
* **Code quality:** 9/10 (concise; just normalize query once and remove unused import)
* **Tests:** 8.5/10 (add aria-sort + asc toggle + column switch test)

This would pass a typical onsite task with ease after those small tweaks.
