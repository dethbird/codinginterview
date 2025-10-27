# Modal via Portal

Build <Modal open onClose={fn}>…</Modal> rendered into a portal.
Acceptance criteria:
- Renders children into a #modal-root (create div if missing).
- Close on ESC key and on backdrop click.
- Trap focus (simple: focus first element on open).

