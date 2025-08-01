### 📘 Redux Basics

Redux is a predictable state container for JavaScript apps. It centralizes state in one store and enforces strict rules to make state changes predictable.

------

## 🔹 Installation & Setup

```bash
npm install redux react-redux @reduxjs/toolkit
```

> ⚡️ Using **Redux Toolkit (RTK)** is now the recommended way—it reduces boilerplate.

------

## 🔹 Core Concepts

### 1. **Store**

Holds the application state. There’s typically **one** store per app.

```ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
```

### 2. **Actions**

Plain JS objects that describe *what* happened. Must have a `type` field.

```ts
// classic action creator
const increment = () => ({ type: 'counter/increment' });
```

With RTK, create them automatically via `createSlice` (below).

### 3. **Reducers**

Pure functions that take the previous state and an action, and return the next state.

```ts
function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'counter/increment':
      return state + 1;
    default:
      return state;
  }
}
```

RTK’s `createSlice` bundles actions + reducer:

```ts
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {
    increment: state => state + 1,
    decrement: state => state - 1,
  },
});

export const { increment, decrement } = counterSlice.actions;
export default counterSlice.reducer;
```

### 4. **Dispatch**

Method to send actions to the store.

```ts
store.dispatch(increment());
```

In React components:

```tsx
import { useDispatch } from 'react-redux';
const dispatch = useDispatch();
dispatch(decrement());
```

### 5. **Selectors**

Functions to read state slices.

```ts
const selectCount = (state: RootState) => state.counter;
```

In components:

```tsx
import { useSelector } from 'react-redux';
const count = useSelector(selectCount);
```

------

## 🔹 Async Logic (Middleware)

Redux only supports synchronous actions by default. Use middleware like **Redux Thunk** or **RTK Query** for async:

```ts
// thunk example
export const fetchUsers = () => async dispatch => {
  const res = await fetch('/api/users');
  const users = await res.json();
  dispatch({ type: 'users/set', payload: users });
};
```

With RTK Query:

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: builder => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
    }),
  }),
});

export const { useGetUsersQuery } = api;
```

------

## 🔹 Best Practices

- Use **Redux Toolkit** (`configureStore`, `createSlice`, RTK Query)
- Keep reducers **pure** and avoid side effects inside them
- Normalize nested data to flat structures for easy updates
- Use selectors for reusable state access
- Co-locate “feature” slices and related logic (ducks pattern)

------

## 🧪 Interview-style Challenge

**Q:** Build a counter slice with `incrementByAmount(amount)` that increases the count by an arbitrary number, and wire it into a component with a button that adds 5 to the total.

1. **Slice:**

   ```ts
   const counterSlice = createSlice({
     name: 'counter',
     initialState: 0,
     reducers: {
       incrementByAmount: (state, action: PayloadAction<number>) => state + action.payload,
     },
   });
   export const { incrementByAmount } = counterSlice.actions;
   ```

2. **Component:**

   ```tsx
   const dispatch = useDispatch();
   return (
     <button onClick={() => dispatch(incrementByAmount(5))}>
       Add 5
     </button>
   );
   ```

