Absolutely—it probably will.
Once a company says *frontend-heavy* **and** uses TypeScript, they’re testing whether you understand *why types make frontend scale*—not whether you can recite syntax.

Here’s what to expect, from fundamentals to “we’re building a serious React app.”

---

### ⚙️ **1. Core TypeScript Concept Questions**

**Type narrowing**

* “How does TypeScript narrow a union inside an `if` block?”
* “When would you use a type guard function, and how does `value is Type` work?”

```ts
function isString(x: unknown): x is string {
  return typeof x === 'string';
}
```

* “Why doesn’t `instanceof` always work for narrowing across modules?”

**Type vs Interface**

* “When do you use `interface` vs `type`? How do they differ when extending?”
* “What’s an intersection type (`&`) vs a union (`|`)? How does it behave when overlapping properties exist?”

**Generics**

* “Write a generic `identity` function.”
* “What are constraints (`<T extends Foo>`)? Why use them?”
* “What happens if you make a generic too wide?”

```ts
function identity<T>(value: T): T { return value; }
```

* “How would you type a hook that takes a fetcher and returns `[data, loading]`?”

**Structural typing**

* “TypeScript uses structural, not nominal typing—what does that mean?”
* “Can two different interfaces with same shape be used interchangeably?”

**Utility types**

* “When would you use `Partial`, `Pick`, `Omit`, `Readonly`, or `Record`?”
* “What’s the difference between `Required<T>` and `NonNullable<T>`?”

---

### 🔍 **2. Practical / React-Focused Questions**

**Props and generics**

* “How would you type a generic list component that renders any data type?”

```tsx
function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  return <ul>{items.map(render)}</ul>;
}
```

**Hooks**

* “How do you type a custom hook that returns a tuple?”
* “Why use `as const` for your return values?”
* “How would you type a `useLocalStorage<T>` hook?”

**Context**

* “What’s the correct pattern for a typed React context with default values?”

```tsx
type Theme = 'dark' | 'light';
const ThemeContext = createContext<Theme | undefined>(undefined);
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be within provider');
  return ctx;
}
```

**Events & refs**

* “How do you type a click event handler?”
* “How do you type a ref to an input element?”

---

### 🧩 **3. Advanced / Scale Questions**

**Discriminated unions**

* “How do discriminated unions help model component state?”

```ts
type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: User[] };
```

**Mapped & conditional types**

* “How would you transform all properties of a type into optional?”
* “Explain `keyof`, `in`, and indexed access types.”
* “What does this mean?”

```ts
type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};
```

**Infer**

* “How does `infer` work inside conditional types?”

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

**Enums vs unions**

* “Why are string literal unions often better than enums in React apps?”

---

### 🔧 **4. Realistic hands-on mini exercises**

**Exercise 1 – narrow & guard**

```ts
type Animal = { kind: 'dog'; bark(): void } | { kind: 'cat'; meow(): void };
function speak(a: Animal) {
  if (a.kind === 'dog') a.bark(); else a.meow();
}
```

Then they’ll ask:
“How could you rewrite that if you didn’t control the `kind` property?”
→ You’d write a **user-defined type guard**.

---

**Exercise 2 – generic hook**

```ts
function useFetch<T>(url: string): [T | null, boolean] { /* ... */ }
```

Then they’ll ask:
“How do you infer the return type when `T` is unknown?”
→ Use `T = unknown` default or overloads.

---

**Exercise 3 – discriminated state**

```ts
type Status = 'idle' | 'loading' | 'success' | 'error';
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

Then they’ll ask:
“How does this help you avoid impossible states in your reducer?”

---

### 🧠 **5. Theory made human**

**Good short answers you can say out loud**

* *“TypeScript’s power is catching domain mismatches early. I use unions and discriminants to model valid states, generics for reusable hooks, and utility types to keep DTOs and components aligned.”*

* *“I don’t fight the compiler; I use it to express intent. I prefer type inference over explicit generics unless I’m writing a library.”*

* *“When typing React components, I treat props as data contracts: the smaller and more explicit, the easier to evolve.”*

---

### ⚡ What Series C companies actually test

They’re usually past “toy app” stage and care about:

* **Type safety at scale** (how types interact across services)
* **Typing React Query / API clients / reducers**
* **DX**: making reusable, well-typed internal components
* **Refactoring safety** — can you read complex types and simplify?

---

If you’d like, I can bundle this into a small **TypeScript + React interview workbook** with 3 sections:

1. Concept questions with quick answers
2. Mini coding challenges (hooks, types, utilities)
3. Real-world architecture prompt (typed fetch/cache layer)

Would you like me to generate that next?
