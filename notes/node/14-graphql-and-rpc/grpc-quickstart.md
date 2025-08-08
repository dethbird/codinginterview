**grpc-quickstart.md**

# gRPC Quickstart (Node.js + TypeScript)

## What & why

**gRPC** is a high-performance RPC framework using **HTTP/2** and **Protocol Buffers**. It gives you:

- **Strong contracts** (proto schemas),
- **Streaming** (server, client, bidi),
- **Binary, fast** payloads,
- **Status codes** (typed errors),
- **Deadlines** and **metadata** (auth/trace).

Use it for **service-to-service** calls, real-time **streams**, or when JSON/REST overhead is too high. For browser clients, you’ll likely use **gRPC-Web** (via Envoy/Ingress) or fall back to REST.

------

## Install (two paths)

```bash
# Runtime loader (quick, minimal typing)
npm i @grpc/grpc-js @grpc/proto-loader

# OR: Strong TS types via codegen (recommended at scale)
npm i -D ts-proto           # protoc plugin
npm i @grpc/grpc-js         # runtime
```

> **Pick one**: proto-loader is fastest to start; **ts-proto** generates full TypeScript server/client types.

------

## Define a proto (example)

```
protos/user.proto
syntax = "proto3";
package users.v1;

message GetUserRequest { string id = 1; }
message User { string id = 1; string email = 2; string name = 3; }
message ListUsersRequest { string org_id = 1; }
message UsersChunk { repeated User users = 1; }

service UserService {
  rpc GetUser (GetUserRequest) returns (User);                 // unary
  rpc ListUsers (ListUsersRequest) returns (stream UsersChunk); // server streaming
}
```

------

## Option A: **ts-proto** codegen (strong typing)

### Generate

```bash
# Install protoc first (brew/apt; ensure `protoc --version` works)
npx protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=src/gen \
  --ts_proto_opt=esModuleInterop=true,outputServices=grpc-js,useOptionals=messages \
  -I protos protos/user.proto
```

Key options:

- `outputServices=grpc-js` → emits service defs for **@grpc/grpc-js**.
- `useOptionals=messages` → maps optional fields to TS optionals.
- `esModuleInterop=true` → nicer imports.

### Server (unary + streaming)

```ts
// src/server.ts
import { Server, ServerCredentials, status } from '@grpc/grpc-js';
import { UserServiceService, UserServiceServer, GetUserRequest, UsersChunk } from './gen/users/v1/user';

const users = new Map([['u1', { id: 'u1', email: 'a@b.com', name: 'Alice' }]]);

const impl: UserServiceServer = {
  GetUser(call, cb) {
    const { id } = call.request as GetUserRequest;
    const u = users.get(id);
    if (!u) return cb({ code: status.NOT_FOUND, message: 'user not found' });
    cb(null, u);
  },

  async ListUsers(call) {
    const orgId = call.request.orgId; // pretend we filter
    // Stream chunks of 100
    const batch: any[] = [];
    for (const u of users.values()) {
      batch.push(u);
      if (batch.length === 100) {
        call.write(UsersChunk.fromPartial({ users: batch }));
        batch.length = 0;
      }
    }
    if (batch.length) call.write({ users: batch });
    call.end();
  }
};

const server = new Server();
server.addService(UserServiceService, impl);
server.bindAsync('0.0.0.0:50051', ServerCredentials.createInsecure(), () => {
  console.log('gRPC on :50051'); server.start();
});
```

### Client (deadline + metadata)

```ts
// src/client.ts
import { credentials, Metadata } from '@grpc/grpc-js';
import { UserServiceClient } from './gen/users/v1/user';

const client = new UserServiceClient('localhost:50051', credentials.createInsecure(), {
  'grpc.keepalive_time_ms': 20_000
});

// Metadata (auth)
const md = new Metadata();
md.set('authorization', `Bearer ${process.env.API_TOKEN}`);

// Unary with deadline
client.GetUser({ id: 'u1' }, md, { deadline: new Date(Date.now() + 2000) }, (err, res) => {
  if (err) return console.error(err.code, err.message);
  console.log(res);
});

// Server streaming
const stream = client.ListUsers({ orgId: 'org1' }, md);
stream.on('data', (chunk) => console.log('chunk', chunk.users?.length));
stream.on('end', () => console.log('done'));
stream.on('error', (e) => console.error(e));
```

------

## Option B: **@grpc/proto-loader** (quick, less strict)

### Load & start server

```ts
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';

const pkgDef = await loader.load('protos/user.proto', {
  keepCase: false, longs: String, enums: String, defaults: true, oneofs: true
});
const proto = grpc.loadPackageDefinition(pkgDef) as any;
const service = proto.users.v1.UserService;

const server = new grpc.Server();
server.addService(service.service, {
  GetUser(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    // ...as above...
  },
  ListUsers(call: grpc.ServerWritableStream<any, any>) {
    // ...call.write(...); call.end();
  }
});
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => server.start());
```

### Client

```ts
const client = new service('localhost:50051', grpc.credentials.createInsecure());
(client as any).GetUser({ id: 'u1' }, (err: grpc.ServiceError, res: any) => { /* ... */ });
```

Loader params you’ll tweak:

- `keepCase`: preserve fieldCase from proto (usually **false** → camelCase in JS).
- `longs/enums`: map types (e.g., to `String` or `Number`).
- `defaults`: populate default values.
- `oneofs`: expose which oneof is set.

------

## Core building blocks (and their args)

- **Server**
   `new Server(options?)` → `addService(def, impl)` → `bindAsync(addr, creds, cb)` → `start()`
   Options you care about:
  - `'grpc.max_receive_message_length'`, `'grpc.max_send_message_length'` (bytes)
  - `'grpc.keepalive_time_ms'`, `'grpc.keepalive_timeout_ms'`
- **Credentials**
  - Insecure (dev): `ServerCredentials.createInsecure()`, `credentials.createInsecure()`.
  - TLS: see below.
- **Metadata** (headers): `new Metadata(); md.set('authorization','Bearer …')`
   On server: `call.metadata.get('authorization')`.
- **Deadlines**: `callOptions.deadline = new Date(Date.now()+ms)`; server gets `call.getDeadline()`.
- **Cancellation**: client `call.cancel()`; watch `'cancelled'`/`'error'`.
- **Status codes**: `status.NOT_FOUND`, `status.INVALID_ARGUMENT`, `status.UNAVAILABLE`, etc.
   On server, pass `{ code, message, details? }` to callback or `call.destroy()` for streams.

------

## TLS & mTLS (production)

### One-way TLS (server cert)

```ts
import { readFileSync } from 'node:fs';
import { ServerCredentials, credentials } from '@grpc/grpc-js';

// Server
const key = readFileSync('certs/server.key');
const cert = readFileSync('certs/server.crt');
const ca = readFileSync('certs/ca.crt'); // optional if public CA
const serverCreds = ServerCredentials.createSsl(ca, [{ private_key: key, cert_chain: cert }], false);

// Client
const clientCreds = credentials.createSsl(ca); // verify server
```

### Mutual TLS (client must present cert)

```ts
// Server (3rd arg true enforces client certs)
const serverCreds = ServerCredentials.createSsl(ca, [{ private_key: key, cert_chain: cert }], true);

// Client (present keypair)
const clientCreds = credentials.createSsl(ca, readFileSync('certs/client.key'), readFileSync('certs/client.crt'));
```

**Notes**

- Ensure **CN/SAN** matches hostname (or set `'grpc.ssl_target_name_override'` for testing).
- Rotate certs with zero-downtime by running two servers or hot-reloading credentials.

------

## Load balancing & discovery

- Default policy is **pick_first**. To enable **round_robin**:

```ts
const client = new UserServiceClient(
  'dns:///users.api.svc.cluster.local:50051',
  credentials.createInsecure(),
  { 'grpc.service_config': JSON.stringify({ loadBalancingConfig: [{ round_robin: {} }] }) }
);
```

- Prefer **DNS (multiple A records)** or a **mesh/LB (Envoy/Linkerd/NGINX)** in production. gRPC uses long-lived HTTP/2; keep **keepalives** enabled.

------

## Auth patterns (realistic)

- **Per-call JWT** in metadata:

```ts
const md = new Metadata(); md.set('authorization', `Bearer ${jwt}`);
client.GetUser(req, md, cb);
```

- **mTLS**: identity via client cert; map cert DN → user/service.
- **API keys** or **HMAC** in metadata for service-to-service.

On the server, put auth in a tiny wrapper:

```ts
function authedUnary<TReq, TRes>(
  fn: (call: grpc.ServerUnaryCall<TReq, TRes>, cb: grpc.sendUnaryData<TRes>, userId: string) => void
) {
  return (call: grpc.ServerUnaryCall<TReq, TRes>, cb: grpc.sendUnaryData<TRes>) => {
    const token = String(call.metadata.get('authorization')[0] || '').replace(/^Bearer\s/i,'');
    const userId = verify(token); // throws if bad
    return fn(call, cb, userId);
  };
}
```

------

## Streaming variants (quick sketches)

- **Client streaming**:

```ts
Upload(call: grpc.ServerReadableStream<Chunk, UploadResult>, cb) {
  const bufs: Buffer[] = [];
  call.on('data', (c) => bufs.push(c.data));
  call.on('end', () => cb(null, { bytes: Buffer.concat(bufs).length }));
}
```

- **Bidi streaming**:

```ts
Chat(call: grpc.ServerDuplexStream<Msg, Msg>) {
  call.on('data', (m) => call.write({ text: `echo: ${m.text}` }));
  call.on('end', () => call.end());
}
```

Watch **backpressure**: only `write` when it returns `true`, or buffer; handle `'drain'`.

------

## Timeouts, retries, fallbacks

- Always set **deadlines** on clients.
- Retry only on **idempotent** calls and **transient** codes (`UNAVAILABLE`, `DEADLINE_EXCEEDED`).
- Simple wrapper:

```ts
async function unaryWithRetry<TReq, TRes>(
  fn: (req: TReq, md: Metadata, opts: any, cb: any) => void,
  req: TReq, md: Metadata, attempts = 3
): Promise<TRes> {
  let lastErr: any;
  for (let i=0; i<attempts; i++) {
    try { return await new Promise<TRes>((res, rej) => fn(req, md, { deadline: new Date(Date.now()+1500) }, (e: any, r: TRes)=> e?rej(e):res(r))); }
    catch (e: any) {
      lastErr = e; if (![14 /* UNAVAILABLE */, 4 /* DEADLINE_EXCEEDED */].includes(e.code)) break;
      await new Promise(r => setTimeout(r, 100 * (i+1)));
    }
  }
  throw lastErr;
}
```

------

## Observability (practical bits)

- **Metrics**: count RPCs by **method/status**, latency histograms. You can wrap server methods and emit Prometheus metrics.
- **Tracing**: use **OpenTelemetry** gRPC instrumentations to capture spans (server & client).
- **Logging**: include `method`, `peer` (`call.getPeer()`), and `requestId` (propagate via metadata).

------

## Health & readiness

Implement the standard **gRPC Health Checking** service so LBs can probe your app. (e.g., `grpc-health-check` package), or expose an HTTP `/health` alongside.

------

## Testing (realistic)

- Start a server on an **ephemeral port**, run client calls, assert, then `server.forceShutdown()`.
- Use **insecure creds** in tests; feed fixtures; simulate errors via `{ code, message }`.

```ts
import getPort from 'get-port';
const port = await getPort();
server.bindAsync(`127.0.0.1:${port}`, ServerCredentials.createInsecure(), () => server.start());
const client = new UserServiceClient(`127.0.0.1:${port}`, credentials.createInsecure());
```

------

## Common pitfalls (and fixes)

- **Browser won’t connect** → browsers need **gRPC-Web** (use Envoy/Ingress translator) or switch to REST/SSE/WebSocket.
- **“UNAVAILABLE” spikes** → LB idle timeout or missing keepalive; set keepalives, check TLS/ALPN to ensure **HTTP/2** end-to-end.
- **TLS hostname mismatch** → set correct SANs or use `'grpc.ssl_target_name_override'` only in dev.
- **Hanging calls** → you forgot a **deadline**; set one for every RPC.
- **Large messages** rejected → raise `'grpc.max_receive_message_length'` (both ends) deliberately; consider **streaming**.

------

## ✅ Interview Tips

- Define **unary vs streaming** and how you pass **metadata** (auth) + **deadlines**.
- Show server error mapping to **`status.\*` codes**.
- Mention **keepalives** and **round_robin/service config** or an external LB for scale.
- Call out **mTLS** for service auth and **OpenTelemetry** for traces.
- Note that browsers need **gRPC-Web** (or choose REST/Socket.IO).

------

Want to continue with **15-patterns-and-architecture/layered-and-clean-architecture.md**, or circle back to any DB/auth section?