Here’s the completed `04-component-patterns/render-props-pattern.md` — focused on the classic but still interview-relevant pattern:

------

### 📘 Render Props Pattern

A **render prop** is a function prop used to share code between components by giving control of what gets rendered.

✅ It allows for code reuse without inheritance or HOC bloat.

------

## 🔹 Core Idea

You pass a function as a child or prop — the parent handles logic, the child decides what to render.

```tsx
<MyComponent render={(data) => (
  <div>{data.value}</div>
)} />
```

------

## 🔹 Example: Mouse Tracker

```tsx
const Mouse = ({ children }: { children: (pos: { x: number; y: number }) => React.ReactNode }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return <>{children(pos)}</>;
};

// Usage
<Mouse>
  {({ x, y }) => <p>Mouse at {x}, {y}</p>}
</Mouse>
```

------

## 🔹 Benefits

✅ Powerful for sharing logic between components
 ✅ No need for inheritance or complicated HOCs
 ✅ Still useful in advanced libraries (e.g., downshift, react-table)

------

## 🔸 Drawbacks

⚠️ Can get messy with deeply nested or multiple render props
 ⚠️ Harder to read than custom hooks in some cases
 ⚠️ Superseded by hooks in most new code

------

## 🔸 When You’ll Still See It

- Legacy libraries (pre-hooks)
- Advanced UI libraries (e.g. `react-table`, `downshift`)
- Interviews that want to see functional composition patterns

------

## 🔹 Alternative: Custom Hooks

Same logic as render props but cleaner:

```tsx
function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}
```

Then use in any component:

```tsx
const { x, y } = useMouse();
```

------

## 🧪 Interview-style challenge

**Q: Build a `Timer` component using a render prop that provides elapsed time.**

```tsx
const Timer = ({ children }: { children: (elapsed: number) => React.ReactNode }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{children(elapsed)}</>;
};

// Usage
<Timer>
  {(elapsed) => <p>Elapsed: {elapsed}s</p>}
</Timer>
```

------

That wraps up `04-component-patterns/`!

Would you like to begin `05-performance/memo-useMemo-useCallback.md` next?