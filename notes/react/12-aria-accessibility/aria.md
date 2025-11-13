Here’s a single, practical reference sheet on **ARIA** (Accessible Rich Internet Applications) — exactly the kind of page you’d keep handy for interviews or when building custom components in React.

---

# 🦻 ARIA Essentials for React Developers

### 🎯 The Purpose

ARIA (Accessible Rich Internet Applications) provides **semantic information** to assistive technologies (like screen readers) when standard HTML semantics aren’t enough.

In plain terms: **ARIA tells a screen reader what your component *means*** when the browser can’t figure it out from native elements alone.

---

## 🧩 1. The Golden Rules

1. **Use native HTML first.**
   Prefer `<button>`, `<label>`, `<input>`, `<dialog>` over re-creating them. Native elements have built-in keyboard and screen-reader support.

2. **Never fake interaction without semantics.**
   If you make a `<div>` behave like a button, add:

   ```html
   role="button" tabindex="0"
   ```

   and handle `Enter`/`Space` key events manually.

3. **ARIA only adds meaning — it doesn’t add behavior.**
   You must manage focus, keyboard interactions, and visibility yourself.

4. **Focus management matters as much as ARIA.**
   Use `focus()`, `tabIndex`, and `aria-activedescendant` to show where the user *is* in the interface.

---

## 🧠 2. Common ARIA Roles & Attributes

| Category               | Role / Attribute                                                                   | Purpose                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Landmarks**          | `banner`, `main`, `navigation`, `contentinfo`, `complementary`                     | Define page sections for screen readers                        |
| **Widgets**            | `button`, `checkbox`, `radio`, `switch`, `slider`, `combobox`, `listbox`, `dialog` | Identify interactive controls                                  |
| **Groupings**          | `group`, `region`, `tabpanel`, `tablist`, `menu`, `menubar`                        | Define relationships between widgets                           |
| **State attrs**        | `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`, `aria-hidden`    | Report component state                                         |
| **Relationship attrs** | `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`                | Connect elements logically                                     |
| **Live regions**       | `aria-live`, `aria-atomic`, `aria-busy`                                            | Announce dynamic updates                                       |
| **Focus**              | `aria-activedescendant`                                                            | Points to the currently active descendant in composite widgets |
| **Modal/Dialog**       | `aria-modal="true"`                                                                | Tells assistive tech that background content is inert          |

---

## 🪟 3. Focus & Keyboard Patterns

### 🔘 Buttons & Toggles

* Native `<button>` = preferred.
* Custom: `role="button"`, `tabindex="0"`, listen for `Enter` and `Space`.
* Toggle: `aria-pressed="true|false"` for state.

### 🧭 Lists & Menus

* `role="listbox"` container, `role="option"` children.
* The controlling input or button references it with `aria-controls` and `aria-expanded`.
* Highlighted item → `aria-activedescendant="<optionId>"`.

### 🧩 Tabs

* `role="tablist"` container.
* Tabs: `role="tab"`, `aria-selected`, `aria-controls`.
* Panels: `role="tabpanel"`, `aria-labelledby`.
* Arrow keys switch between tabs.

### 🧾 Modals / Dialogs

* `role="dialog"` (or `alertdialog`)
* `aria-modal="true"` + `aria-labelledby` (title) + optional `aria-describedby`
* Trap focus inside; restore focus on close.
* Close on Escape.
* Set background `aria-hidden="true"` or `inert`.

### 🔍 Combobox / Autocomplete

* Input:

  ```html
  role="combobox"
  aria-autocomplete="list"
  aria-expanded="true|false"
  aria-controls="listbox-id"
  aria-activedescendant="option-id"
  ```
* Popup: `role="listbox"`, items: `role="option"`.
* Arrows navigate, Enter selects, Escape closes.
* Input keeps focus; update `aria-activedescendant` dynamically.

---

## 🧱 4. State + Visibility Patterns

| State                             | Recommended ARIA                                                 |                    |
| --------------------------------- | ---------------------------------------------------------------- | ------------------ |
| Element hidden                    | `hidden` or `aria-hidden="true"`                                 |                    |
| Element expanded (accordion/menu) | `aria-expanded="true                                             | false"` on trigger |
| Element disabled                  | `aria-disabled="true"` (but also block pointer events)           |                    |
| Selection in list/tab             | `aria-selected="true"`                                           |                    |
| Validation errors                 | `aria-invalid="true"`, `aria-describedby` pointing to error text |                    |

---

## 🗣️ 5. Live Regions (Dynamic Updates)

For dynamic content like chat messages, toasts, or counters:

```html
<div aria-live="polite">3 new notifications</div>
```

* `aria-live="polite"` = announce when idle
* `aria-live="assertive"` = interrupt immediately (use rarely!)
* `aria-atomic="true"` = read entire region, not just changed text

---

## 🧰 6. Testing Accessibility

### ✅ Automated

* **axe-core / Jest-axe** for unit tests
* **Lighthouse / Storybook a11y** for CI
* **eslint-plugin-jsx-a11y** during dev

### 🧑‍🦯 Manual

* Use **Tab** navigation and **screen reader (NVDA, VoiceOver)**.
* Check focus order, label association, escape routes (Escape key closes modals).

---

## ⚡ 7. Quick Best Practices

1. **Always label interactive elements.**
   Use `<label>` or `aria-label`.

2. **Use `aria-describedby`** for helper/error text near inputs.

3. **One active `aria-activedescendant` per container.**

4. **Don’t use `aria-hidden` on focusable elements.**
   Screen readers will ignore them completely.

5. **Announce changes to dynamic UI.**
   e.g., when filters update results, place result count in a `aria-live="polite"` region.

6. **Mind color contrast** — ARIA doesn’t fix visual accessibility.

---

## 🧭 8. Handy ARIA Snippets

**Modal title link**

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Settings</h2>
</div>
```

**Accordion trigger**

```html
<button aria-expanded="false" aria-controls="sect-1">More info</button>
<div id="sect-1" hidden>...</div>
```

**Combobox input**

```html
<input
  role="combobox"
  aria-controls="city-list"
  aria-expanded="true"
  aria-activedescendant="city-opt-2"
/>
<ul role="listbox" id="city-list">
  <li role="option" id="city-opt-1">Paris</li>
  <li role="option" id="city-opt-2" aria-selected="true">Tokyo</li>
</ul>
```

---

### 📚 References

* [WAI-ARIA Authoring Practices 1.2 (W3C)](https://www.w3.org/WAI/ARIA/apg/)
* [MDN: ARIA roles and states](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
* [Deque University ARIA patterns](https://dequeuniversity.com/library/aria/)
* [React a11y patterns (React docs)](https://react.dev/learn/accessibility)

---

Would you like me to format this as a clean **Markdown `.md` file** (ready to download or commit to your notes repo)? It’ll keep the headings, examples, and tables neat.
