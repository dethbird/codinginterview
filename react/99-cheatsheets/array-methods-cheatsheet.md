### 📘 Array Methods Cheatsheet

------

## 🔹 `.map()`

Transforms each element into a new array.

```tsx
const doubled = [1, 2, 3].map(n => n * 2); // [2, 4, 6]
```

In React, used for rendering lists:

```tsx
<ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
```

------

## 🔹 `.filter()`

Returns elements matching a condition.

```tsx
const evens = [1, 2, 3, 4].filter(n => n % 2 === 0); // [2, 4]
```

------

## 🔹 `.reduce()`

Reduces array to a single value.

```tsx
const sum = [1, 2, 3].reduce((acc, val) => acc + val, 0); // 6
```

------

## 🔹 `.find()`

Finds first element matching condition.

```tsx
const firstEven = [1, 3, 4, 6].find(n => n % 2 === 0); // 4
```

------

## 🔹 `.some()`

Returns true if any element matches condition.

```tsx
const hasNegative = [1, -2, 3].some(n => n < 0); // true
```

------

## 🔹 `.every()`

Returns true if all elements match condition.

```tsx
const allPositive = [1, 2, 3].every(n => n > 0); // true
```

------

## 🧪 Interview-style challenge

**Q:** Use `.reduce()` to count occurrences of each item in an array.

```tsx
const counts = arr.reduce((acc, item) => {
  acc[item] = (acc[item] || 0) + 1;
  return acc;
}, {});
```

