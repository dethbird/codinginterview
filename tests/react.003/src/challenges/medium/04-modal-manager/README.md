
# Medium 04 — Modal Manager (Context; no Portal)
Create a `ModalProvider` with context exposing `open(content)` and `close()`.
`<ModalRoot/>` renders active modal inline (no portal).

Requirements:
- Only one modal at a time
- ESC and backdrop click close it
- Provide hook `useModal()`
