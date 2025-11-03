# T3 — HTTP GET JSON with Timeout

Goal: `node index.js <url>` → fetch JSON and print a field; timeout after 2s.

Steps
- Validate URL
- AbortController with setTimeout(..., 2000)
- fetch(url, { signal }); if !ok -> print status+snippet and exit 1
- parse json; console.log a useful field or entire object
