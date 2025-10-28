# Medium 04 — Modal Manager (Context)
Create a `ModalProvider` with context exposing `open(content)` and `close()`.
`<ModalRoot/>` renders the active modal via a portal.

Requirements:
- Only one modal at a time
- ESC and backdrop click close it
- Provide hook `useModal()`
