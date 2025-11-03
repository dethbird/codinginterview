# T4 — Uppercase Transform

Goal: Transform stdin to uppercase and write to stdout using a Transform stream.

Steps
- Create Transform with transform(chunk, enc, cb)
- this.push(chunk.toString('utf8').toUpperCase())
- pipe stdin -> transform -> stdout
