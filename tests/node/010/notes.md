Nice—networking time. I won’t spoil it; here’s a sharp plan + skeleton so you can wire it up.

### What to implement

* Parse CLI arg; bail with usage if missing.
* `https.get(url, res => …)` (or `http.get` if the URL is http).
* If `res.statusCode === 200`: accumulate `chunk.length` into a counter; on `'end'` print the count.
* If **non-200**:

  * **3xx**: optionally follow `Location` (basic redirect hop).
  * Otherwise print a clear error and exit `1`.
* Handle `'error'` on the request and the response.
* Optional: add a short timeout.

### Pitfalls

* Use the right module (`http` vs `https`) based on the URL.
* Some servers send compressed bodies; you’re counting **raw bytes received**, so summing `chunk.length` is correct.
* Watch for redirect loops (cap hops, e.g., 5).

### Skeleton (fill in the TODOs)

```js
// count-url.js
'use strict';
const http = require('http');
const https = require('https');
const { URL } = require('url');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node count-url.js <url>');
  process.exit(1);
}

function getClient(u) {
  return u.protocol === 'http:' ? http : https;
}

function fetchAndCount(u, hops = 0) {
  // TODO: if hops too large (e.g., >5), print error and exit(1)

  const client = getClient(u);
  const req = client.get(u, (res) => {
    const { statusCode } = res;

    // Handle redirects (3xx) minimally
    // TODO: if 301/302/303/307/308 and Location exists → recurse with new URL, hops+1

    if (statusCode !== 200) {
      // TODO: print non-200 error (status + message), exit(1)
      res.resume(); // drain
      return;
    }

    let bytes = 0;
    res.on('data', (chunk) => {
      // TODO: accumulate bytes += chunk.length
    });
    res.on('end', () => {
      // TODO: print bytes to stdout
    });
  });

  // Optional timeout
  // TODO: req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });

  req.on('error', (err) => {
    // TODO: print error message and exit(1)
  });
}

let urlObj;
try {
  urlObj = new URL(input);
} catch {
  console.error('Error: invalid URL');
  process.exit(1);
}

fetchAndCount(urlObj);
```

### Quick test ideas

* `node count-url.js https://example.com/` → prints a small number (\~1250–2000 bytes).
* Redirect: `https://httpbin.org/redirect-to?url=https://example.com/` → follows → counts.
* HTTP: `http://example.com/` (switches to `http` module).
* Non-200: `https://httpbin.org/status/404` → error path.
* Network error: bad domain → error handler.

Ship your implementation and I’ll do a punchy review + try to break it with redirects and errors.
