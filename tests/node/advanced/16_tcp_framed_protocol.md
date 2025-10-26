# 16) Minimal gRPC-like Framing over TCP

**Goal:** 4-byte BE length prefix + JSON payload; handle split/merged packets.

### 💎 Gold answer (`tcp-framed.js`)
```js
'use strict';
const net = require('net');

function encode(obj) {
  const payload = Buffer.from(JSON.stringify(obj));
  const buf = Buffer.allocUnsafe(4 + payload.length);
  buf.writeUInt32BE(payload.length, 0);
  payload.copy(buf, 4);
  return buf;
}

function createDecoder(onMsg) {
  let buf = Buffer.alloc(0);
  return (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 4) {
      const len = buf.readUInt32BE(0);
      if (len > 10 * 1024 * 1024) {
        // defensive check
        this?.destroy?.(new Error('message too large'));
        return;
      }
      if (buf.length < 4 + len) break;
      const body = buf.slice(4, 4 + len);
      buf = buf.slice(4 + len);
      try {
        onMsg(JSON.parse(body.toString('utf8')));
      } catch {}
    }
  };
}

const server = net.createServer(sock => {
  const onMsg = (obj) => {
    // echo with ack
    sock.write(encode({ ok: true, got: obj }));
  };
  const decoder = createDecoder(onMsg);
  sock.on('data', decoder);
});

server.listen(4500, () => console.log('framed server :4500'));

module.exports = { encode, createDecoder };
```

### Notes
- Backpressure on writes: check `sock.write(buf)` return value and wait for `'drain'` if needed in heavy senders.
