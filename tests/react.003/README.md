# React Interview Practice — v3 (Stable Harness)

Same questions as v2. Tests are rewritten to be deterministic:
- No portals in tests (modal renders inline)
- No `userEvent` + fake-timers combo
- When timers are needed, we auto-start and use `vi.advanceTimersByTimeAsync` wrapped in `act`

## Quickstart
```bash
npm i
npm run dev -- --host 0.0.0.0
# visit http://<vm-ip>:5173
npm run test:watch
```
