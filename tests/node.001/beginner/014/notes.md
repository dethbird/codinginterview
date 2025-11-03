A) I couldn't really figute this one out. My attempt was to so something like `withLogging(http.createServer(req, res) => {});` but I could use help on this one.

---


✅ Great instincts — you were *very close!*

Let’s break it down clearly.

---

### 🧠 What the question wants

You already have a **higher-order function** (`withLogging`) that wraps a handler.
You just need to **pass the wrapped handler** into `http.createServer`.

That means you’ll define a normal request handler (e.g. `myHandler`) → wrap it → start the server.

---

### ⚙️ What you missed conceptually

* `http.createServer()` expects a *function with signature* `(req, res) => { … }`.
* You don’t call `http.createServer(req,res)` directly — you **pass** a function reference.
* Your wrapper `withLogging(handler)` returns a new function that’s compatible with `createServer`.

So your goal is:

```js
const server = http.createServer(withLogging(myHandler));
```

That’s it.

---

### 💎 Gold answer (for notes)

```js
// logger-mw.js
'use strict';
const http = require('http');

function withLogging(handler) {
  return (req, res) => {
    const start = Date.now();

    // Fires when response has been fully sent
    res.on('finish', () => {
      const dur = Date.now() - start;
      console.error(`${req.method} ${req.url} ${res.statusCode} ${dur}ms`);
    });

    try {
      handler(req, res);
    } catch (err) {
      // If handler throws before sending headers
      res.statusCode = 500;
      res.end('Internal Server Error');
      console.error('Handler error:', err);
    }
  };
}

function myHandler(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not Found');
  }
}

const server = http.createServer(withLogging(myHandler));

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
```

---

### 🧪 Test idea

```bash
$ curl -i http://localhost:3000/health
HTTP/1.1 200 OK
content-type: application/json
{"ok":true}

# stderr (or console):
GET /health 200 1ms
```

---

### 🧩 Key takeaways

* `withLogging(handler)` is a **middleware factory** — it returns a decorated version of the handler.
* The `'finish'` event always fires (even on errors or early closes), making it perfect for timing.
* Wrapping handlers like this is how frameworks like Express build middleware chains under the hood.
