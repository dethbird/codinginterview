import { Transform } from 'stream';

export function csvToJsonStream({ skipInvalid = false } = {}) {
  let buf = '';
  let headers = null;

  function parseLine(line) {
    const out = [];
    let i = 0, cur = '', inQ = false;
    while (i < line.length) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i+1] === '"') { cur += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        cur += ch; i++; continue;
      } else {
        if (ch === '"') { inQ = true; i++; continue; }
        if (ch === ',') { out.push(cur); cur = ''; i++; continue; }
        cur += ch; i++; continue;
      }
    }
    out.push(cur);
    return out;
  }

  return new Transform({
    readableObjectMode: false,
    writableObjectMode: false,
    transform(chunk, enc, cb) {
      try {
        buf += chunk.toString('utf8');
        let m;
        while ((m = buf.match(/^(.*?)(\r?\n)/s))) {
          const line = m[1];
          buf = buf.slice(m[0].length);
          if (line === '' && headers == null) continue;
          if (headers == null) {
            headers = parseLine(line);
          } else {
            const cols = parseLine(line);
            if (skipInvalid && cols.length !== headers.length) continue;
            const obj = {};
            for (let i = 0; i < headers.length; i++) obj[headers[i]] = cols[i] ?? '';
            this.push(JSON.stringify(obj) + "\n");
          }
        }
        cb();
      } catch (e) { cb(e); }
    },
    flush(cb) {
      try {
        if (buf) {
          const line = buf.replace(/\r?\n$/, '');
          if (headers == null && line) {
            headers = parseLine(line);
          } else if (headers) {
            const cols = parseLine(line);
            if (!(skipInvalid && cols.length !== headers.length)) {
              const obj = {};
              for (let i = 0; i < headers.length; i++) obj[headers[i]] = cols[i] ?? '';
              this.push(JSON.stringify(obj) + "\n");
            }
          }
        }
        cb();
      } catch (e) { cb(e); }
    }
  });
}
