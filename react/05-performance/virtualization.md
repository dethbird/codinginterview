Here’s your markdown page for `05-performance/virtualization.md` — focused on the concept of virtualization, `react-window` usage, and realistic interview application:

------

### 📘 Virtualization in React

**Virtualization** means rendering only the visible items in a list — instead of rendering everything.

✅ Huge performance gains for large lists
 ✅ Reduces DOM nodes and memory usage

------

## 🔹 When to Use It

- Large lists or tables (100+ rows)
- Scrollable feeds, logs, inboxes
- Infinite scroll / pagination UIs

------

## 🔹 `react-window` Example

```bash
npm install react-window
import { FixedSizeList as List } from 'react-window';

const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
  <div style={style}>
    Row {index}
  </div>
);

const MyList = () => (
  <List
    height={300}       // height of the list viewport
    itemCount={1000}   // total items
    itemSize={35}      // height per row (px)
    width={'100%'}
  >
    {Row}
  </List>
);
```

✅ Only renders visible rows
 ✅ Scales to thousands of items easily

------

## 🔸 How It Works

- Only a small subset of rows are **mounted in the DOM**
- Scroll position determines which rows to render
- You provide height, count, and row size — the lib handles the math

------

## 🔹 Libraries to Know

| Library             | Use Case                    |
| ------------------- | --------------------------- |
| `react-window`      | Simple, fast virtualization |
| `react-virtual`     | Headless hooks-style        |
| `react-virtualized` | Older, powerful but heavier |

------

## 🔸 Use With Dynamic Lists?

Use `VariableSizeList` from `react-window` for dynamic-height rows:

```tsx
import { VariableSizeList as List } from 'react-window';
```

You must supply a function for row size per index.

------

## 🧠 Tips

- Avoid rendering full maps (`.map(...)`) for massive data sets — use virtualization
- Combine with lazy-loading (infinite scroll) for best results
- Don't forget to set a `key` even in virtualized items if they're dynamic

------

## 🧪 Interview-style challenge

**Q: You’re given 10,000 log lines to render in a scrolling list. How do you optimize it?**

✅ Use `react-window` to only render visible items
 ✅ Combine with memoized rows (`React.memo`) if needed
 ✅ Consider batch loading from server if the list is streamed

------

Want to move on to `reconciliation.md` next — the last in the performance section?