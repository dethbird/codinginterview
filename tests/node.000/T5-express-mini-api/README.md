# T5 — Mini Express API: /health and /echo

Goal: Build a small Express app:
- GET /health -> { status: "ok" }
- POST /echo (JSON) -> echoes body
- Logger middleware (method, url, status, duration)
- Error handler -> { error }

Try:
npm run start:t5
curl -s http://localhost:3000/health
curl -s -XPOST http://localhost:3000/echo -H 'content-type: application/json' -d '{"x":1}'
