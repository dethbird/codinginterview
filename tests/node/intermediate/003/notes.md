✅ got you—let’s nail this one.

You want to stream a **huge CSV** line-by-line, sum a given **column index**, handle **BOM**, and avoid loading the whole file. Quoted CSV support is out of scope (we’ll document that).

Here’s a clean, testable solution that:

* validates args,
* supports an optional `--header` flag to skip the first row,
* strips a UTF-8 BOM,
* coerces numbers safely, and
* ignores non-numeric cells.

---

### 💎 Gold answer (drop-in)

```js
// sum-col.js
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');

(async function main() {
  // CLI: node sum-col.js <file.csv> <colIndex> [--header]
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    console.error('Usage: node sum-col.js <file.csv> <colIndex> [--header]');
    process.exit(1);
  }

  const filePath = argv[0];
  const colIndexRaw = argv[1];
  const hasHeader = argv.includes('--header');

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const col = Number(colIndexRaw);
  if (!Number.isInteger(col) || col < 0) {
    console.error(`Invalid colIndex: ${colIndexRaw} (must be a non-negative integer)`);
    process.exit(1);
  }

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
    .on('error', (err) => {
      console.error('Failed to read file:', err.message);
      process.exit(1);
    });

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity, // handle \r\n without splitting mid-line
  });

  let sum = 0;
  let lineNo = 0;

  for await (const rawLine of rl) {
    let line = rawLine;
    if (lineNo === 0) {
      // Strip UTF-8 BOM if present
      if (line.charCodeAt(0) === 0xFEFF) {
        line = line.slice(1);
      }
      if (hasHeader) {
        lineNo++;
        continue; // skip header row
      }
    }

    // NOTE: This is a naive CSV split. It does NOT support quoted fields with commas.
    // Documented limitation per problem statement.
    const cells = line.split(',');
    if (col >= cells.length) {
      lineNo++;
      continue; // no value for this column on this row
    }

    const raw = cells[col].trim();
    // Coerce to number; ignore non-numeric cells
    // (Alternative policy: throw if NaN — choose per test requirements)
    if (raw !== '') {
      const n = Number(raw);
      if (!Number.isNaN(n)) sum += n;
    }

    lineNo++;
  }

  // Print the sum (no formatting)
  console.log(sum);
})().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
```

---

### 🧪 Quick tests

```bash
# basic
echo -e "1,2,3\n4,5,6\n7,8,9" > t.csv
node sum-col.js t.csv 1         # → 2 + 5 + 8 = 15

# header toggle
echo -e "a,b,c\n1,2,3\n4,5,6" > th.csv
node sum-col.js th.csv 1 --header   # → 2 + 5 = 7

# BOM (simulated): Node handles BOM strip we coded on first line
printf '\xEF\xBB\xBFx,y\n10,20\n' > bom.csv
node sum-col.js bom.csv 1 --header  # → 20

# non-numeric mixed
echo -e "n,val\nA,2\nB,foo\nC,3.5\n" > mix.csv
node sum-col.js mix.csv 1 --header  # → 5.5
```

---

### 🔍 Notes / choices

* **Header handling:** explicit `--header` flag; default is “no header”.
* **NaN policy:** we **ignore** non-numeric cells. If your tests require strictness, swap the ignore for a `throw`.
* **Quoted CSV:** not supported (documented). If needed later, use a streaming parser like `csv-parse` with `{ bom: true }`.

If you want, paste any failing test output and I’ll tweak the behavior to match the grader’s expectations exactly (e.g., NaN policy or header defaults).
