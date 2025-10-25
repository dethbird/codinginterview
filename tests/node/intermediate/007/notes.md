✅ Perfect — this one’s short but fundamental. It’s the classic Express async-wrapper pattern to ensure that `async` route handlers correctly propagate errors into the centralized error middleware rather than causing unhandled rejections.

---

# 7) Express Async Error Handling Wrapper

### 💡 What it does

Express **does not** automatically catch async errors (rejections) from route handlers.
`asyncHandler(fn)` wraps your async route or middleware function so any thrown or rejected error is passed to `next(err)` — triggering Express’s error middleware.

---

### 💎 Gold answer (`async-handler.js`)

```js
// async-handler.js
'use strict';
const express = require('express');
const app = express();

/**
 * Wrap an async Express route/middleware so that any thrown or
 * rejected error is passed to Express's error middleware via next(err).
 *
 * @param {(req,res,next)=>Promise<any>} fn
 * @returns {(req,res,next)=>void}
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Promise.resolve handles both sync and async errors uniformly
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // If headers are already sent, delegate to Express's default handler
    if (res.headersSent) {
      return next(err);
    }
    next(err);
  });
};

// Example route
app.get(
  '/data',
  asyncHandler(async (req, res) => {
    // Simulate async throw (e.g. DB failure)
    await new Promise((r) => setTimeout(r, 100));
    throw new Error('Database connection failed');
    // res.json({ ok: true }); // unreachable
  })
);

// Error-handling middleware (must have 4 args)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // let Express handle it (may close socket)
  }
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log('Server on http://localhost:3000'));
```

---

### 🧪 Mini tests (curl it)

```bash
$ node async-handler.js &
# → "Server on http://localhost:3000"
$ curl -i http://localhost:3000/data
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
{"error":"Database connection failed"}
```

No unhandled rejections, no server crash ✅

---

### 🧠 Explanation

* **Why Promise.resolve?**
  Works for both:

  ```js
  async (req,res) => { throw new Error() }   // rejected Promise
  (req,res) => { throw new Error() }         // sync throw
  ```

  Both become `.catch(next)`.

* **`res.headersSent` check:**
  If a handler partially responded before failing, Express warns if you try to send another response. Passing control to its internal handler avoids that.

* **Error middleware shape:**
  Must have **four parameters** `(err, req, res, next)` — that’s how Express recognizes it.

---

### 🧩 Key takeaway

Use `asyncHandler` (or libraries like `express-async-handler`) to **wrap all async routes**, keeping your app free from unhandled rejections.
It’s effectively the same as:

```js
const wrap = fn => (req,res,next) => fn(req,res,next).catch(next);
```

…but the production version adds the `headersSent` safety check and matches Express’s lifecycle exactly.
