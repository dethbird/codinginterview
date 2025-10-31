Yup—this is exactly the **Medium 01: Form Wizard** checklist. I’ll turn each box into working code + tests so you can drop it in.

# What you’ll get

* **Next/Prev handlers** ✅
* **Three sections** (Account → Profile → Confirm) with navigation ✅
* **Submit button on last section** (Next becomes Submit) ✅
* **Validation** run on every edit and before step changes ✅
* **Global state via `useReducer`** ✅
* **Submitted view** showing payload with **password obfuscated** ✅

---

## `index.jsx` (FormWizard)

```jsx
import React, { useEffect, useMemo, useReducer } from 'react'

const STEPS = ['Account', 'Profile', 'Confirm'] as const
type Step = 0 | 1 | 2

type Data = {
  email: string
  password: string
  name: string
  city: string
}

type State = {
  step: Step
  data: Data
  errors: Record<string, string>
  submitted: boolean
}

type Action =
  | { type: 'update'; patch: Partial<Data> }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'setErrors'; errors: Record<string, string> }
  | { type: 'submit' }

const initialState: State = {
  step: 0,
  data: { email: '', password: '', name: '', city: '' },
  errors: {},
  submitted: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'update':
      return { ...state, data: { ...state.data, ...action.patch } }
    case 'setErrors':
      return { ...state, errors: action.errors }
    case 'next':
      return { ...state, step: Math.min((state.step + 1) as Step, 2 as Step) }
    case 'prev':
      return { ...state, step: Math.max((state.step - 1) as Step, 0 as Step) }
    case 'submit':
      return { ...state, submitted: true }
    default:
      return state
  }
}

function validate(data: Data, step: Step): Record<string, string> {
  const e: Record<string, string> = {}
  if (step === 0) {
    if (!data.email) e.email = 'Email required'
    else if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'Invalid email'
    if (!data.password) e.password = 'Password required'
    else if (data.password.length < 6) e.password = 'Min 6 chars'
  }
  if (step === 1) {
    if (!data.name) e.name = 'Name required'
    if (!data.city) e.city = 'City required'
  }
  // step 2 is confirm (no new inputs)
  return e
}

function maskPassword(pw: string) {
  if (!pw) return ''
  return '•'.repeat(Math.max(6, pw.length))
}

export default function FormWizard() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { step, data, errors, submitted } = state

  // Re-run validation whenever step or relevant data changes
  useEffect(() => {
    dispatch({ type: 'setErrors', errors: validate(data, step) })
  }, [data, step])

  const isLast = step === 2
  const canPrev = step > 0
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors])

  const nextOrSubmit = () => {
    // run a final validate-gate for current step before advancing
    const e = validate(data, step)
    if (Object.keys(e).length) {
      dispatch({ type: 'setErrors', errors: e })
      return
    }
    if (isLast) {
      dispatch({ type: 'submit' })
      return
    }
    dispatch({ type: 'next' })
  }

  if (submitted) {
    return (
      <div>
        <h2>Submitted!</h2>
        <pre data-testid="payload">
{JSON.stringify(
  { ...data, password: maskPassword(data.password) },
  null,
  2
)}
        </pre>
      </div>
    )
  }

  return (
    <div>
      <h1>Form Wizard</h1>
      <div data-testid="step">{step}</div>
      <h2>{STEPS[step]}</h2>

      {step === 0 && (
        <section aria-label="Account">
          <label>
            Email
            <input
              aria-label="email"
              value={data.email}
              onChange={e => dispatch({ type: 'update', patch: { email: e.target.value } })}
            />
          </label>
          {errors.email && <div role="alert">{errors.email}</div>}
          <label>
            Password
            <input
              aria-label="password"
              type="password"
              value={data.password}
              onChange={e => dispatch({ type: 'update', patch: { password: e.target.value } })}
            />
          </label>
          {errors.password && <div role="alert">{errors.password}</div>}
        </section>
      )}

      {step === 1 && (
        <section aria-label="Profile">
          <label>
            Name
            <input
              aria-label="name"
              value={data.name}
              onChange={e => dispatch({ type: 'update', patch: { name: e.target.value } })}
            />
          </label>
          {errors.name && <div role="alert">{errors.name}</div>}
          <label>
            City
            <input
              aria-label="city"
              value={data.city}
              onChange={e => dispatch({ type: 'update', patch: { city: e.target.value } })}
            />
          </label>
          {errors.city && <div role="alert">{errors.city}</div>}
        </section>
      )}

      {step === 2 && (
        <section aria-label="Confirm">
          <ul>
            <li>Email: {data.email}</li>
            <li>Password: {maskPassword(data.password)}</li>
            <li>Name: {data.name}</li>
            <li>City: {data.city}</li>
          </ul>
        </section>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={() => dispatch({ type: 'prev' })} disabled={!canPrev}>Prev</button>
        <button onClick={nextOrSubmit}>{isLast ? 'Submit' : 'Next'}</button>
        {/* optional UX: show current-step errors gate */}
        {hasErrors && <div aria-live="polite" style={{ opacity: 0.7 }}>Fix errors to continue</div>}
      </div>
    </div>
  )
}
```

---

## `index.test.jsx` (focused, deterministic)

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormWizard from './index.jsx'

it('navigates steps and blocks on validation, then submits with obfuscated password', async () => {
  const user = userEvent.setup()
  render(<FormWizard />)

  // step 0 -> block next on empty
  expect(screen.getByTestId('step')).toHaveTextContent('0')
  await user.click(screen.getByRole('button', { name: /Next/i }))
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  expect(screen.getByTestId('step')).toHaveTextContent('0')

  // fill valid account
  await user.type(screen.getByLabelText('email'), 'a@b.com')
  await user.type(screen.getByLabelText('password'), 'secret1')
  // proceed
  await user.click(screen.getByRole('button', { name: /Next/i }))
  expect(screen.getByTestId('step')).toHaveTextContent('1')

  // step 1 -> block if missing
  await user.click(screen.getByRole('button', { name: /Next/i }))
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  // fill profile
  await user.type(screen.getByLabelText('name'), 'Rishi')
  await user.type(screen.getByLabelText('city'), 'Cincinnati')
  await user.click(screen.getByRole('button', { name: /Next/i }))
  expect(screen.getByTestId('step')).toHaveTextContent('2')

  // last step shows Submit
  expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Submit/i }))

  // submitted view with masked password
  const payload = screen.getByTestId('payload').textContent
  expect(payload).toMatch(/"email": "a@b\.com"/)
  expect(payload).toMatch(/"password": "•{6,}"/) // masked
  expect(payload).toMatch(/"name": "Rishi"/)
  expect(payload).toMatch(/"city": "Cincinnati"/)
})
```

---

## Mapping back to your checklist

* **[x] onclick handlers on next/prev** → `nextOrSubmit`, `dispatch({type:'prev'})`
* **[x] basic blocks for each section** → three `<section>` blocks keyed by `step`
* **[x] if next to last section, button becomes submit** → `isLast ? 'Submit' : 'Next'`
* **[x] run validator before each section change** → `useEffect` on `[data, step]` + guard inside `nextOrSubmit`
* **[x] a global state with items per section (useReducer?)** → single `useReducer` for data/step/errors/submitted
* **[x] if state is submitted, show submission contents (obfuscate password)** → `submitted` branch + `maskPassword`

If you want me to tune validation rules (e.g., stronger email), or split the reducer into smaller reducers per step, say the word and I’ll refactor fast.
