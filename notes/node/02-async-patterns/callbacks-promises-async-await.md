**callbacks-promises-async-await.md**

# Callbacks, Promises, and Async/Await

## 📌 Definition

Node.js handles asynchronous work using:

1. **Callbacks** — The original pattern, often *error-first* style.
2. **Promises** — Objects representing eventual success/failure.
3. **Async/Await** — Syntactic sugar over Promises for cleaner code.

Understanding all three is crucial — older codebases still use callbacks, while newer ones favor async/await.

------

## 1️⃣ Callbacks

### 📋 Error-First Callbacks

The Node.js convention:

```js
function callback(err, result) { ... }
```

- **`err`** → `null` if no error, otherwise an `Error` object.
- **`result`** → The data if operation succeeded.

Example:

```js
const fs = require('fs');

fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  console.log('File contents:', data);
});
```

**Why it matters in work:**
 Many core modules (fs, crypto, etc.) still use this style — you need to know how to handle both error and success paths.

------

## 2️⃣ Promises

### 📋 Definition

A **Promise** represents a value that will be available later.
 Has 3 states: *pending*, *fulfilled*, *rejected*.

Example:

```js
const readFile = require('fs/promises').readFile;

readFile('data.txt', 'utf8')
  .then(data => console.log('File:', data))
  .catch(err => console.error('Error:', err));
```

**Parameters:**

- `.then(onFulfilled, onRejected?)`
- `.catch(onRejected)`
- `.finally(onFinally)`

------

### 🛠 Real-World Example: Parallel Promises

```js
const fetch = require('node-fetch');

Promise.all([
  fetch('https://api.example.com/users').then(res => res.json()),
  fetch('https://api.example.com/orders').then(res => res.json())
])
.then(([users, orders]) => {
  console.log('Users:', users.length, 'Orders:', orders.length);
})
.catch(console.error);
```

**Benefit:** Run independent tasks in parallel for performance.

------

## 3️⃣ Async/Await

### 📋 Definition

`async`/`await` makes Promise code look synchronous.

Example:

```js
const fetch = require('node-fetch');

async function getUserData() {
  try {
    const res = await fetch('https://api.example.com/users');
    const users = await res.json();
    console.log(users);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

getUserData();
```

------

### 🛠 Real-World Example: API + Database Flow

```js
import fetch from 'node-fetch';
import { pool } from './db.js'; // Assume pg Pool

async function syncUserData() {
  try {
    const res = await fetch('https://api.example.com/users');
    const users = await res.json();

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [user.id, user.name]
      );
    }
    console.log('Users synced successfully');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}
```

**Why it matters in work:**
 This is a common “pull from API → store in DB” scenario.

------

## 🔄 Converting Callbacks to Promises

```js
const util = require('util');
const fs = require('fs');

const readFileAsync = util.promisify(fs.readFile);

readFileAsync('data.txt', 'utf8')
  .then(console.log)
  .catch(console.error);
```

**Interview tip:** `util.promisify` is your friend when modernizing legacy code.

------

## ✅ Interview Tips

- Be able to **convert between all three styles**.
- Know **when to use Promise.all vs Promise.allSettled**.
- For async/await, stress **`try/catch`** for error handling.
- Be ready for “**Refactor this callback hell into async/await**” type tasks.

------

Next file will be:
 **timers-nexttick-setimmediate.md** — we’ll dig into timing functions, their parameters, and real-world sequencing problems.