# M2 — `csvToJsonStream({ skipInvalid })`

Goal: Transform CSV → JSONL (one JSON object per line). First row is header.  
Supports quoted fields with commas and escaped quotes `""` per RFC 4180.
