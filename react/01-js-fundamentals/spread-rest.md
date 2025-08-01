### 📘 Spread & Rest Operators (JS Fundamentals)

The `...` operator is used in two distinct but related ways:

- **Spread**: Expands an array or object
- **Rest**: Collects items into an array or object

------

## 🟦 Spread Syntax

#### ✅ Spread with Arrays

Used to **copy** or **merge** arrays.

```ts
const nums = [1, 2, 3];
const copy = [...nums]; // [1, 2, 3]
const extended = [...nums, 4, 5]; // [1, 2, 3, 4, 5]
```

🧠 In React: Used to immutably update state.

```ts
const [list, setList] = useState(['a', 'b']);
setList(prev => [...prev, 'c']); // adds 'c' to the list
```

#### ✅ Spread with Objects

Used to **shallow copy** or **merge** objects.

```ts
const user = { name: 'Alice' };
const updated = { ...user, age: 30 }; // { name: 'Alice', age: 30 }
```

🧠 In React: Often used when updating nested state.

```ts
const [form, setForm] = useState({ name: '', email: '' });
setForm(prev => ({ ...prev, name: 'Bob' }));
```

#### 🔁 Merge example

```ts
const defaults = { theme: 'light', show: true };
const userPrefs = { show: false };

const settings = { ...defaults, ...userPrefs };
// { theme: 'light', show: false } — userPrefs override defaults
```

------

## 🟨 Rest Syntax

Collects remaining items into a new array or object.

#### ✅ Rest with Arrays (function args)

```ts
function sum(...args: number[]) {
  return args.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6
```

🧠 Useful for variadic functions (any number of args).

#### ✅ Rest with Destructuring

**Object:**

```ts
const { a, ...rest } = { a: 1, b: 2, c: 3 };
console.log(rest); // { b: 2, c: 3 }
```

**Array:**

```ts
const [first, ...others] = [1, 2, 3, 4];
console.log(others); // [2, 3, 4]
```

------

## ⚠️ Gotchas

- Spread/rest is **shallow** — nested objects/arrays are not deeply cloned.
- You can’t use spread on non-iterables (e.g. numbers, `null`).
- Avoid mutating the original array/object when using spread — always return new copies for React state.

------

## 🧪 Interview-style challenge

**Q: Add a new key `isAdmin: true` to every user in a list without mutating the original.**

```ts
const users = [{ name: 'A' }, { name: 'B' }];

const updated = users.map(u => ({ ...u, isAdmin: true }));
```

