Here’s your interview-ready notes for `11-interview-patterns/todo-list.md`, covering a classic todo list implementation:

------

### 📘 Todo List Component

Implementing a todo list tests your skills with state arrays, forms, and rendering dynamic lists.

------

## 🔹 Basic Setup with `useState`

```tsx
import { useState } from 'react';

type Todo = { id: number; text: string; completed: boolean };

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');

  const addTodo = () => {
    if (!text.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text, completed: false }]);
    setText('');
  };

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </>
  );
};
```

------

## 🔹 Key Points

- State array to store todos
- Adding new todo immutably
- Toggling completed with map and condition
- Using `key` prop with unique id

------

## 🧪 Interview-style challenge

**Q:** Add a “Delete” button for each todo that removes it from the list.

------

Ready for `modal-component.md` next?