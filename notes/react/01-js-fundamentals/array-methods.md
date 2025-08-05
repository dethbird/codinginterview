### 📘 Array Methods

Array methods are essential for transforming and analyzing data in React components. You’ll use these constantly for rendering lists, filtering results, and updating state.

- [map](#map)
- [filter](#filter)
- [reduce](reduce)
- [find](find)
- [some / every](#some-every)
- [includes](#includes)
- [forEach](#forEach)



------

#### `.map()`

Used to transform each item in an array and return a new array of the same length.

```ts
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2); // [2, 4, 6]
```

🧠 In React: You’ll use `.map()` to render lists of components:

```tsx
const items = ['apple', 'banana', 'orange'];
return (
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```

------

#### `.filter()`

Returns a new array containing only elements that match a condition.

```ts
const nums = [1, 2, 3, 4];
const even = nums.filter(n => n % 2 === 0); // [2, 4]
```

🧠 In React: Useful when implementing search, removing items, or showing subsets of data.

```tsx
const [query, setQuery] = useState('');
const filteredItems = items.filter(item => item.includes(query));
```

------

#### `.reduce()`

Reduces an array to a single value (sum, object, etc.)

```ts
const numbers = [1, 2, 3, 4];
const sum = numbers.reduce((acc, cur) => acc + cur, 0); // 10
```

🧠 In React: Often used for totals or grouping items.

```ts
const cart = [{ price: 5 }, { price: 10 }];
const total = cart.reduce((sum, item) => sum + item.price, 0); // 15
```

------

#### `.find()`

Returns the **first** item matching a condition (or `undefined` if not found).

```ts
const users = [{ id: 1 }, { id: 2 }];
const user = users.find(u => u.id === 2); // { id: 2 }
```

------

#### `.some()` / `.every()`

- `.some()` checks if **at least one** item matches
- `.every()` checks if **all** items match

```ts
const nums = [1, 3, 5];
nums.some(n => n % 2 === 0);  // false
nums.every(n => n < 10);      // true
```

🧠 In React: Often used in form validation.

```ts
const allFilled = inputs.every(input => input.value !== '');
```

------

#### `.includes()`

Checks if an array contains a specific value.

```ts
const tags = ['react', 'js'];
tags.includes('js'); // true
```

------

#### `.forEach()`

Iterates over items, but does **not** return anything. Not commonly used in React components.

```ts
items.forEach(item => console.log(item));
```

⚠️ Prefer `.map()` or `.reduce()` for transformations — `forEach` is better for side effects like logging.

------

#### 🔥 Tip: Chaining

You can chain these methods for powerful one-liners.

```ts
const result = items
  .filter(i => i.active)
  .map(i => i.name.toUpperCase());
```

------

#### 🧪 Interview-style challenge

**Q: Given an array of todo items, return only the names of the completed ones.**

```ts
const todos = [
  { id: 1, name: 'Learn map', done: true },
  { id: 2, name: 'Learn reduce', done: false },
];

const completedNames = todos
  .filter(todo => todo.done)
  .map(todo => todo.name); // ['Learn map']
```

