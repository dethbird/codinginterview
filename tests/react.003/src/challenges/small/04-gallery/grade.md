Nice! Your Gallery works and you hit most of the spec. Here’s a quick grade + a tuned “golden” version you can drop in.

# Verdict

## ✅ What you did right

* Clicking a thumbnail updates the main image.
* `aria-current="true"` marks the active thumb.
* Keyboard left/right implemented — and you **did** the bonus wrap. 👍
* Clean, readable state (`idx`) and handlers.

## ⚠️ What to improve

1. **Keyboard focus/a11y**

   * Arrow handling is on the wrapper. It works after a user clicks a thumb (keydown bubbles), but without a prior click, the wrapper isn’t focusable, so the keyboard won’t do anything.
   * Prefer a **roving tabindex** so the *active* thumbnail is focusable and focused when `idx` changes. This gives SR users state feedback and ensures arrows always work.
2. **ARIA roles (optional)**

   * A simple `ul` of buttons is fine, but you can enhance by setting `role="listbox"` and `role="option"` or keep the current semantics and just ensure focus mgmt.
3. **Tiny nits**

   * Typo: `handleThumnailClick` → `handleThumbnailClick`.
   * `if (!e.key) return;` isn’t needed in JSDOM/tests.
4. **Tests**

   * Add: verify **main image updates on keyboard**, verify **left arrow** and **wrap** both ways, and a test for **empty images** (“No images”).

---

# Golden solution (roving tabindex + focus, wrap both ways)

```jsx
import React, { useEffect, useRef, useState } from 'react'

export default function Gallery({ images = [] }) {
  const [idx, setIdx] = useState(0)
  const btnRefs = useRef([])

  // Keep refs array length in sync with images
  useEffect(() => {
    btnRefs.current = btnRefs.current.slice(0, images.length)
  }, [images.length])

  // Focus the active thumbnail on index change
  useEffect(() => {
    if (!images.length) return
    const el = btnRefs.current[idx]
    el?.focus()
  }, [idx, images.length])

  if (!images.length) return <p>No images</p>

  const active = images[idx]

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setIdx(i => (i - 1 + images.length) % images.length)
        break
      case 'ArrowRight':
        e.preventDefault()
        setIdx(i => (i + 1) % images.length)
        break
      default:
        break
    }
  }

  return (
    <div>
      <img src={active.src} alt={active.alt} data-testid="main" />
      <ul onKeyDown={onKeyDown}>
        {images.map((im, i) => (
          <li key={im.src}>
            <button
              ref={el => (btnRefs.current[i] = el)}
              aria-current={i === idx}
              tabIndex={i === idx ? 0 : -1}  // roving tabindex
              onClick={() => setIdx(i)}
            >
              <img src={im.src} alt={im.alt} width="32" height="32" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Why this is better

* **Keyboard always works**: active thumb is focusable and focused.
* **A11y**: screen readers get focus/selection feedback via `aria-current` and focus movement.
* **Wrap**: handled with `% images.length`.

---

# Test suggestions (add-on)

```js
it('Keyboard right updates main image and aria-current', async () => {
  const user = userEvent.setup()
  render(<Gallery images={imgs} />)
  // focus active (idx 0) via tab or click
  await user.click(screen.getAllByRole('button')[0])
  await user.keyboard('{ArrowRight}')
  expect(screen.getByTestId('main')).toHaveAttribute('src', '2.jpg')
  expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-current', 'true')
})

it('Wraps left from first to last', async () => {
  const user = userEvent.setup()
  render(<Gallery images={imgs} />)
  await user.click(screen.getAllByRole('button')[0])
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByTestId('main')).toHaveAttribute('src', '3.jpg')
})

it('Shows fallback for empty list', () => {
  render(<Gallery images={[]} />)
  expect(screen.getByText(/No images/i)).toBeInTheDocument()
})
```

---

## Final grade

* **Correctness:** 9/10 (meets all requirements, nice wrap)
* **Accessibility:** 7/10 (works, but add roving focus for SR users)
* **Tests:** 8/10 (good; add keyboard → main-image assertion + wrap/empty cases)

This is solid. Push the focus/a11y bit and it’s interview-ready.
