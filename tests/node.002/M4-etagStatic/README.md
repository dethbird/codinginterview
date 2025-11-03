# M4 — `etagStatic(root)`

Goal: Bare `http` static server with ETag and single `Range:` support.
- Normalize path; forbid traversal.
- 304 on matching `If-None-Match`.
- Minimal content-types for `.txt,.json,.js,.html,.css`.
