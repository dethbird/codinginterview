# 25) Incremental YAML → JSON Converter (streaming)

**Goal:** Stream large YAML (one doc per `---`) from stdin to NDJSON; skip invalid docs; limited subset (`key: value` per line).

### 💎 Gold answer (`yaml-to-ndjson.js`)
```js
'use strict';

let buf = '';
const sep = /^---\s*$/m;

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let m;
  while ((m = buf.match(sep))) {
    const idx = m.index;
    const doc = buf.slice(0, idx);
    if (doc.trim()) emitDoc(doc);
    buf = buf.slice(idx + m[0].length);
  }
});

process.stdin.on('end', () => {
  if (buf.trim()) emitDoc(buf);
});

function emitDoc(txt) {
  try {
    const obj = parseSimpleYaml(txt);
    process.stdout.write(JSON.stringify(obj) + '\n');
  } catch (e) {
    // skip invalid doc
  }
}

// VERY limited YAML: lines "key: value"; ignores indentation and sequences
function parseSimpleYaml(txt) {
  const obj = {};
  const lines = txt.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i === -1) throw new Error('invalid');
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    else if (/^(true|false)$/i.test(val)) val = /^true$/i.test(val);
    else if (val === 'null' || val === '~') val = null;
    else if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
    obj[key] = val;
  }
  return obj;
}
```

### Notes
- Not a real YAML parser — just enough for the kata: flat `key: value` pairs.
- Invalid/multiline values cause the doc to be skipped.
