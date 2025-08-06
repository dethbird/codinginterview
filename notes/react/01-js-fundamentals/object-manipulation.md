Here’s a markdown page for `01-js-fundamentals/object-manipulation.md` — designed to be concise, useful in interviews, and copy-paste ready:

------

### 📘 Object Manipulation (JS Fundamentals)

Modern JavaScript provides shorthand syntax and destructuring features that help you write cleaner code and avoid mutation — critical in React apps.

------

## 🔹 Object Destructuring

Extract values from objects concisely.

```ts
const user = { name: 'Alice', age: 30 };
const { name, age } = user;
```

🧠 Works great in function params:

```ts
function greet({ name }: { name: string }) {
  console.log(`Hi, ${name}`);
}
```

------

## 🔹 Shorthand Property Names

When the variable name matches the key name:

```ts
const name = 'Cher';
const dog = { name }; // same as { name: name }
```

------

## 🔹 Computed Property Names

Use dynamic keys in object literals:

```ts
const key = 'breed';
const dog = { [key]: 'Beagle' }; // { breed: 'Beagle' }
```

------

## 🔹 Object Spread

Copy or extend objects immutably:

```ts
const base = { name: 'Alice', age: 30 };
const updated = { ...base, age: 31 }; // overrides age
```

------

## 🔹 Optional Chaining (`?.`)

Safe property access without null errors:

```ts
const user = { profile: { name: 'A' } };
const name = user.profile?.name; // 'A'
const zip = user.address?.zip; // undefined, no error
```

------

## 🔹 Nullish Coalescing (`??`)

Fallback only if `null` or `undefined`:

```ts
const name = user.name ?? 'Anonymous';
```

> ⚠️ Unlike `||`, this won’t treat empty strings or `0` as falsy.

------

## 🔹 Object.entries() / Object.keys() / Object.values()

Useful for looping over objects:

```ts
const obj = { a: 1, b: 2 };

Object.keys(obj);   // ['a', 'b']
Object.values(obj); // [1, 2]
Object.entries(obj); // [['a', 1], ['b', 2]]
```

🧠 Often used to map over an object’s values:

```ts
Object.entries(obj).map(([key, val]) => `${key}=${val}`);
```

------

## 🧪 Interview-style challenge

**Q: You get a `settings` object and want to separate the `theme` key from the rest.**

```ts
const settings = { theme: 'dark', fontSize: 14, compact: true };

const { theme, ...rest } = settings;
// theme = 'dark'
// rest = { fontSize: 14, compact: true }
```

