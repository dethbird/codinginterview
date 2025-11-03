# S4 — `jsonlCounter(readable, {relaxed})`

Goal: Count valid JSON objects from a JSON Lines (JSONL) stream (chunk-safe).  
- Ignore blank lines and whitespace.  
- `relaxed: true` tolerates trailing commas on a line (e.g., `{"a":1},`).  
- Reject on stream error.
