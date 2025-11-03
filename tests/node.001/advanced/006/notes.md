You got it — here’s a compact, O(1)-per-item streaming parser that converts a **gigantic JSON array** from stdin into **NDJSON** on stdout. It scans characters, tracks string/escape state and nesting depth, slices elements at **top-level commas** and the closing `]`, and discards processed buffer segments so memory stays flat.

# 6) Streaming JSON Array → NDJSON (O(1) memory)

```js
// json-array-to-ndjson.js
'use strict';

process.stdin.setEncoding('utf8');

let buf = '';           // sliding window buffer
let inStr = false;      // currently inside a quoted string?
let esc = false;        // previous char was a backslash within a string?
let depth = 0;          // bracket/brace depth; top-level array elements exist at depth===1
let started = false;    // saw the opening '['
let itemStart = 0;      // index in buf where the current element starts (relative to buf)

/**
 * Emit the slice [itemStart, end) as a line (trimmed). Then drop everything
 * up to (and including) the separator at index `sepIdx` from the buffer,
 * and reset indices so parsing continues from the start of the new buf.
 */
function emitAndCut(end, sepIdx) {
  const slice = buf.slice(itemStart, end).trim();
  if (slice.length) {
    // Optionally: JSON.parse(slice) then JSON.stringify to normalize.
    // We pass through as-is (valid JSON per problem), one value per line.
    process.stdout.write(slice + '\n');
  }
  // Drop processed region (through sepIdx)
  buf = buf.slice(sepIdx + 1);
  // Reset local indices to the start of new buffer segment
  itemStart = 0;
}

process.stdin.on('data', chunk => {
  buf += chunk;

  // Walk through current buffer
  for (let i = 0; i < buf.length; i++) {
    const ch = buf[i];

    if (inStr) {
      // Inside a string: handle escapes and quote termination
      if (esc) {
        esc = false;       // consume the escaped char
      } else if (ch === '\\') {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }

    // Not in a string
    if (ch === '"') {
      inStr = true;
      esc = false;
      continue;
    }

    // Opening brackets/braces increase depth
    if (ch === '[') {
      if (!started) {
        started = true;
        depth = 1;
        // The first element starts after the '['
        itemStart = i + 1;
        continue;
      }
      depth++;
      continue;
    }

    if (ch === '{') { depth++; continue; }

    // Comma at depth==1 separates elements → emit current element
    if (ch === ',' && started && depth === 1) {
      emitAndCut(i, i);      // element ends right before this comma
      // After cutting, the buffer shrank; restart scanning from beginning
      i = -1;                // because the for-loop will i++ to 0
      continue;
    }

    // Closing braces/brackets decrease depth
    if (ch === '}') { depth--; continue; }

    if (ch === ']') {
      // This closes either nested arrays or the top-level array.
      depth--;
      if (started && depth === 0) {
        // End of the top-level array → emit the final element (if any)
        emitAndCut(i, i);
        // We consumed up through the ']' — we can stop; ignore trailing junk/whitespace
        started = false;
        // Clear buffer before continuing (or leave it for any trailing content)
        buf = buf.slice(0); // no-op; keep to show intent
        // We’re done parsing the array; remaining data (if any) is ignored.
        // To be strict, you could assert that only whitespace remains.
        break;
      }
      continue;
    }
    // All other characters (whitespace, digits, letters in literals) just continue
  }

  // If buffer grows very large without a separator (e.g., a single massive element),
  // it’s still O(size of current element). That’s expected for O(1)-per-item behavior.
});

process.stdin.on('end', () => {
  // If input ended without a final ']' or comma (malformed), try to flush any last item.
  // This is lenient; strict parsers would error. We only emit if we saw a '[' and have content.
  if (started && itemStart < buf.length) {
    const tail = buf.slice(itemStart).trim();
    if (tail && tail !== ']') {
      process.stdout.write(tail + '\n');
    }
  }
});
```

## How it works (quick)

* Tracks:

  * `inStr` + `esc` to safely ignore commas/brackets *inside strings* (handles `\"`, `\\`, `\n`, `\uXXXX`, etc.).
  * `depth` to detect **top-level commas** (only split at `depth === 1`).
  * `started` to ignore any pre-array whitespace.
* On each **top-level comma** → emit the element slice and **cut the buffer** up to that comma (so memory stays O(current element size)).
* On the **closing `]`** at `depth`→0 → emit the final element, stop.

## Notes / edge cases

* **Whitespace** anywhere is fine; we `trim()` slices.
* **Nested objects/arrays**: depth accounting handles them.
* **Unicode escapes**: We don’t need to interpret them; we just avoid splitting inside strings correctly.
* **Validation**: This assumes the input is a valid JSON array; to be stricter, `JSON.parse(slice)` before writing and then `JSON.stringify` it (slower, but validates/normalizes).
* **Empty array** `[]`: emits nothing (correct).
* **Numbers / booleans / null / strings** as elements are handled just like objects.

## Usage

```bash
# Convert big array to NDJSON:
node json-array-to-ndjson.js < big.json > out.ndjson

# Example:
echo '[{"a":1}, {"b":[1,2,3]}, "x", 42, null]' | node json-array-to-ndjson.js
# =>
# {"a":1}
# {"b":[1,2,3]}
# "x"
# 42
# null
```

This is the classic interview pattern for streaming a top-level JSON array without loading it into memory.
