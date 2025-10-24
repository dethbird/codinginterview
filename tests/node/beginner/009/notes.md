Nice—this one is pure “Node core muscles.” I won’t spoil it, but here’s a tight plan + a commented skeleton you can fill in.

### What to implement

* **Routing:** branch on `req.method` + **pathname** (ignore query string).
* **GET /health:** `200` with JSON `{"status":"ok"}` and `Content-Type: application/json`.
* **POST /echo:** read the body (collect chunks), **optionally cap size** (e.g., 1 MB), parse JSON (return `400` on invalid), then echo it back as JSON.
* **Everything else:** `404` JSON.

### Edge-case tips

* Parse path with `new URL(req.url, 'http://localhost')` → use `url.pathname`.
* If `Content-Type` isn’t `application/json`, you can still try to parse (or reject with `415`—your call, but be consistent).
* Guard against huge bodies: track `bytes += chunk.length` and `413` if over limit.
* On JSON parse failure: `400` with `{"error":"invalid_json"}` (clear and testable).
* Always set `Content-Type: application/json; charset=utf-8`.

---

### Skeleton (fill in the TODOs)

```js
// server-basic.js
'use strict';
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

function json(res, status, data) {
  // TODO: set statusCode, setHeader Content-Type, end with JSON.stringify(data)
}

async function readBody(req, limitBytes = 1_000_000) {
  // TODO:
  // - collect chunks from req ('data', 'end', 'error')
  // - enforce limitBytes (throw an error you can catch for 413)
  // - return Buffer.concat(chunks).toString('utf8')
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const { method } = req;
    const { pathname } = url;

    // GET /health
    // TODO: if method === 'GET' && pathname === '/health' → return { status: 'ok' }

    // POST /echo
    // TODO: if method === 'POST' && pathname === '/echo'
    //   - const raw = await readBody(req)
    //   - try { const data = JSON.parse(raw) } catch → 400 invalid_json
    //   - return the parsed object as JSON with 200

    // Default 404
    // TODO: return 404 { error: 'not_found' }
  } catch (err) {
    // Optional: map custom error for body-too-large to 413
    // Fallback: 500 { error: 'internal', detail: err.message }
  }
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

---

### Quick curl test plan

```bash
# health
curl -i http://localhost:3000/health
# → 200 / {"status":"ok"}

# echo happy path
curl -i -X POST http://localhost:3000/echo \
  -H 'Content-Type: application/json' \
  -d '{"a":1,"b":"x"}'
# → 200 / {"a":1,"b":"x"}

# invalid json
curl -i -X POST http://localhost:3000/echo -H 'Content-Type: application/json' -d '{bad'
# → 400 / {"error":"invalid_json"}

# not found
curl -i http://localhost:3000/does-not-exist
# → 404 / {"error":"not_found"}
```

When you’ve filled this in, paste your version and I’ll do a punchy line-by-line review—and try to break it with nasty inputs like giant bodies or missing headers.
