### 📘 Compound Components Pattern

The **Compound Component** pattern lets multiple components work together under a shared parent context — offering flexibility with a clean API.

You’ll see it in libraries like `@headlessui`, `Radix`, or `React Router`.

------

## 🔹 What Are Compound Components?

They are multiple components that **communicate implicitly** via shared context or parent-child composition — not props drilling.

------

### ✅ Example: Custom `<Tabs>` Component

```tsx
<Tabs>
  <Tabs.List>
    <Tabs.Trigger value="a">Tab A</Tabs.Trigger>
    <Tabs.Trigger value="b">Tab B</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="a">Content A</Tabs.Panel>
  <Tabs.Panel value="b">Content B</Tabs.Panel>
</Tabs>
```

------

## 🔹 How it Works: Use Context Internally

```tsx
const TabsContext = createContext<{
  value: string;
  setValue: (val: string) => void;
} | null>(null);

export const Tabs = ({ children }: { children: ReactNode }) => {
  const [value, setValue] = useState('a');
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
};

export const TabsTrigger = ({ value, children }: { value: string; children: ReactNode }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Must be used inside <Tabs>');
  return (
    <button onClick={() => ctx.setValue(value)}>
      {children}
    </button>
  );
};

export const TabsPanel = ({ value, children }: { value: string; children: ReactNode }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  return ctx.value === value ? <div>{children}</div> : null;
};
```

------

## 🔹 Benefits

✅ Clean & readable API
 ✅ No prop-drilling
 ✅ Flexible structure
 ✅ Easy to customize layout

------

## 🔸 Tradeoffs

⚠️ Slightly more complex to implement
 ⚠️ Context adds re-render overhead if not optimized

------

## 🧠 Real-world Examples

- `react-router`: `<Routes>` + `<Route>`
- `headlessui`: `<Menu>`, `<Menu.Item>`, `<Menu.Button>`
- Your own: `<Form>`, `<Form.Input>`, `<Form.Error>`

------

## 🧪 Interview-style challenge

**Q: Build a `<Toggle>` component that toggles child visibility**

```tsx
const ToggleContext = createContext<{ on: boolean; toggle: () => void } | null>(null);

export const Toggle = ({ children }: { children: ReactNode }) => {
  const [on, setOn] = useState(false);
  const toggle = () => setOn(prev => !prev);

  return (
    <ToggleContext.Provider value={{ on, toggle }}>
      {children}
    </ToggleContext.Provider>
  );
};

export const ToggleButton = () => {
  const ctx = useContext(ToggleContext)!;
  return <button onClick={ctx.toggle}>{ctx.on ? 'Hide' : 'Show'}</button>;
};

export const ToggleContent = ({ children }: { children: ReactNode }) => {
  const ctx = useContext(ToggleContext)!;
  return ctx.on ? <div>{children}</div> : null;
};
```

