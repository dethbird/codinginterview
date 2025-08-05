### 📘 Context API (State Management)

The Context API lets you share data (state, functions) through the component tree without prop drilling.

------

## 🔹 Creating a Context

```tsx
import { createContext } from 'react';

type Theme = 'light' | 'dark';
export const ThemeContext = createContext<Theme>('light');
```

- Provide a **default** value for fallback when no provider exists above.

------

## 🔹 Providing Context

Wrap your tree (or subtree) with a Provider:

```tsx
import { ThemeContext } from './ThemeContext';

function App() {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}
```

------

## 🔹 Consuming Context

### 1. `useContext` Hook

```tsx
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click Me</button>;
}
```

### 2. Context Consumer (Class or JSX)

```tsx
<ThemeContext.Consumer>
  {theme => <button className={theme}>Click</button>}
</ThemeContext.Consumer>
```

------

## 🔸 Updating Context

If you need to update context value, pass an **object** or tuple:

```tsx
export const AuthContext = createContext<{
  user: string | null;
  login: (name: string) => void;
}>({ user: null, login: () => {} });
```

Then:

```tsx
<AuthContext.Provider value={{ user, login }}>
  {children}
</AuthContext.Provider>
```

Consume:

```tsx
const { user, login } = useContext(AuthContext);
```

------

## 🔹 Performance Considerations

- Every context value change **re-renders** all consumers
- Avoid putting frequently changing values in context
- Use state management libraries (Redux, Zustand) for high-frequency updates

------

## 🧠 When to Use Context

✅ Theming (light/dark)
 ✅ Authentication data
 ✅ Locale/language settings
 ✅ UI state (modals, toasts)

⛔ Avoid for:

- High-frequency or large state (use a store)
- Simple parent → child props (keep it local)

------

## 🧪 Interview-style challenge

**Q:** Build a `LocaleContext` that provides the current locale and a `setLocale` function, then consume it in a `LanguageSwitcher` component.

```tsx
// LocaleContext.tsx
export const LocaleContext = createContext<{
  locale: string;
  setLocale: (l: string) => void;
}>({
  locale: 'en',
  setLocale: () => {}
});

// App.tsx
const [locale, setLocale] = useState('en');
<LocaleContext.Provider value={{ locale, setLocale }}>
  <LanguageSwitcher />
</LocaleContext.Provider>

// LanguageSwitcher.tsx
const { locale, setLocale } = useContext(LocaleContext);
return (
  <select value={locale} onChange={e => setLocale(e.target.value)}>
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
);
```