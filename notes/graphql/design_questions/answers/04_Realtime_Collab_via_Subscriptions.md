# 4) Realtime Collab via Subscriptions

## Problem
Add **live presence** and **document updates** (cursor positions + edits) with **backfill on reconnect**.

**Constraints:** PHP app server; dedicated WebSocket gateway allowed; Redis or Kafka available.  
**Challenges:** transport choice, scalable fan-out, idempotency, ordering guarantees, backpressure, reconnect/resume.

---

## High-Level Architecture
- **HTTP GraphQL API (PHP)** for queries/mutations and history reads.
- **WebSocket Gateway** (e.g., Ratchet/Swoole/Workerman, or Node/Nest if preferred) that speaks GraphQL over WebSocket (graphql-ws / graphql-transport-ws). It authenticates, authorizes, and bridges to pub/sub.
- **Pub/Sub Bus**
  - **Redis** (simple, single region, low latency fan-out).
  - **Kafka** (durable, ordered partitions, multi-consumer groups, better for multi-region and replay).  
- **State Stores**
  - Presence: Redis Hash/Sets with TTL heartbeat.
  - Document history: Postgres table `doc_events` (append-only) or Kafka topic per doc for replay.
  - Latest snapshot every N events for quick backfill.

---

## GraphQL Schema (SDL)
```graphql
scalar ISO8601

type Subscription {
  presence(docId: ID!): PresenceEvent!               # join/leave/heartbeat/cursor
  edits(docId: ID!, fromSeq: BigInt): EditEvent!     # live edits + optional backfill from seq
}

type Mutation {
  postEdit(input: EditInput!): AppendResult!         # optional: server-originated edits via mutation
  updateCursor(docId: ID!, position: Cursor!): Boolean!
}

input EditInput {
  docId: ID!
  clientId: ID!              # stable per tab/session
  seq: BigInt!               # client seq for idempotency (monotonic per clientId per doc)
  baseVersion: BigInt!       # optimistic version (OT/CRDT base)
  op: JSON!                  # OT operation or CRDT delta
  timestamp: ISO8601
}

type AppendResult {
  accepted: Boolean!
  assignedVersion: BigInt
}

type PresenceEvent {
  type: PresenceEventType!
  docId: ID!
  userId: ID!
  clientId: ID!
  cursor: Cursor
  timestamp: ISO8601!
}

enum PresenceEventType { JOIN LEAVE HEARTBEAT CURSOR }

type EditEvent {
  docId: ID!
  version: BigInt!           # authoritative increasing doc version
  clientId: ID!
  userId: ID!
  op: JSON!
  ts: ISO8601!
  idempotencyKey: String!    # e.g., <docId>:<clientId>:<seq>
}

input Cursor { x: Float!, y: Float!, selectionStart: Int, selectionEnd: Int }
```

Notes:
- `presence` is **ephemeral** (Redis pub/sub), `edits` are **durable** (Kafka or DB) to support replay.
- `fromSeq` or `fromVersion` allows **resume** after reconnect with backfill.

---

## Pub/Sub Topology
**Channels/Topics**
- Presence: `presence:{docId}` (Redis pub/sub). Heartbeats every 10s; Redis key `presence_live:{docId}` → Set of `{clientId}` with TTL=30s.
- Edits: `edits:{docId}`
  - Redis Stream (simple region) **or**
  - Kafka topic partitioned by `docId` (ensures per-doc ordering).

**Fan-out**
- WebSocket gateway subscribes to relevant channels per connected client.
- For Kafka, a **consumer group per gateway instance**; one partition per doc ensures order to all clients on that doc.

---

## Ordering & Idempotency
- **Authoritative version** increments per accepted edit (server assigns `version`).
- **IdempotencyKey** = `{docId}:{clientId}:{seq}`; store last accepted `seq` per `(docId, clientId)` in Redis with TTL (e.g., 24h). Reject duplicates.
- If using OT (Operational Transform): transform incoming op against all ops with `version >= baseVersion` before append. If CRDT: merge delta; server computes new version as a monotonic counter for sequencing.

---

## Backfill / Reconnect Strategy
- Client maintains `(docId, lastVersion)`.
- On reconnect:
  1) Subscribe with `fromSeq` or `fromVersion = lastVersion + 1`.
  2) Gateway reads tail from durable store (DB or Kafka) and streams missed events before switching to live feed.
- **Snapshots**: store `snapshot(version, content)` every N events (e.g., every 100 edits). Backfill process: snapshot → apply deltas `> snapshot.version`.

---

## Backpressure Plan
- **Outbound**: per-socket send buffer cap (e.g., 1-2 MB or 1s of events). If exceeded, drop client or downgrade to periodic summaries (e.g., throttle cursor to 10Hz).
- **Inbound**: rate limit per client (e.g., 100 edits/sec, 20 presence updates/sec). Over limit → 429 close with retry-after.
- **Broker**: for Kafka, use bounded consumer lag alerts; for Redis Stream, trim length per doc (e.g., keep last 10k events).

---

## Auth on Subscribe (and Every Message)
1) Client connects with JWT in connection params; validate signature/exp/aud.  
2) On `subscribe`, verify **doc access** (e.g., user is a collaborator) via PHP API or cached ACL in Redis.  
3) Attach `userId`, `clientId`, and allowed `docId[]` to the connection context.  
4) Enforce **docId scoping** on every event to avoid confused-deputy bugs.

---

## PHP / Gateway Pseudocode
```php
// On connection_init
$jwt = verifyJWT($params['authToken']);
$ctx = ['userId' => $jwt->sub, 'scopes' => $jwt->scopes];

// Subscribe: presence
function subscribePresence($docId, $ctx) {
  assertAllowed($ctx['userId'], $docId);
  redis->sadd("presence_live:$docId", $ctx['clientId']);
  redis->expire("presence_live:$docId", 30);
  pub("presence:$docId", event('JOIN', ...));
  return redisPubSub("presence:$docId"); // stream to client
}

// Subscribe: edits
function subscribeEdits($docId, $fromVersion, $ctx) {
  assertAllowed($ctx['userId'], $docId);
  // Backfill
  foreach (loadEventsFrom($docId, $fromVersion+1) as $e) yield $e;
  // Live
  foreach (busSubscribe("edits:$docId") as $e) yield $e;
}

// Mutation: postEdit
function postEdit($input, $ctx) {
  assertAllowed($ctx['userId'], $input['docId']);
  $key = "idem:{$input['docId']}:{$input['clientId']}";
  $lastSeq = redis->get($key) ?? 0;
  if ($input['seq'] <= $lastSeq) return ['accepted' => false];
  // Load tail ops >= baseVersion and transform/merge
  $ops = loadOps($input['docId'], $input['baseVersion']);
  $opT = transform($input['op'], $ops);
  $version = appendOp($input['docId'], $opT, $ctx['userId'], $input['clientId']);
  redis->setex($key, 86400, $input['seq']);
  pub("edits:{$input['docId']}", {..., 'version' => $version});
  return ['accepted' => true, 'assignedVersion' => $version];
}
```

---

## Data Model (History)
**Option A - Postgres append-only**
```sql
CREATE TABLE doc_events (
  doc_id      uuid NOT NULL,
  version     bigint NOT NULL,
  user_id     uuid NOT NULL,
  client_id   uuid NOT NULL,
  op          jsonb NOT NULL,
  ts          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (doc_id, version)
);
CREATE INDEX ON doc_events (doc_id, ts DESC);
```
**Option B - Kafka**
- Topic `edits` with key=`docId` → partition by key for ordering.
- Consumer writes snapshots to Postgres/Redis for fast resume.

---

## Presence Details
- Heartbeat every **10s**: client sends `PresenceEvent(type=HEARTBEAT)`; server `PEXPIRE presence_live:{docId}` keys.
- Cursor updates throttled to **10-20 Hz** per client to reduce noise.
- Gateway publishes JOIN/LEAVE/HEARTBEAT/CURSOR onto `presence:{docId}`; consumers fan-out to subscribers.

---

## Transport Choice
- **graphql-transport-ws** over WebSockets. Fallback to **Server-Sent Events (SSE)** for restricted networks (presence only, or edits if latency requirements are relaxed).

---

## Metrics & Alerts
- `active_docs`, `active_clients`, `messages_in/out`, `avg_payload`, `consumer_lag`, `dropped_clients`.
- Alerts: consumer lag > 2s, backpressure kicks > 1/min per gateway, Redis memory > 80%, Kafka partition under-replicated.

---

## Multi-Region Fan-out (Follow-up)
- Prefer **Kafka with geo-replication** (MirrorMaker 2). Keep per-doc affinity (route collaborators to same region when possible). Use **CRDT** to avoid OT complexity under high latency.
- Presence remains region-local; cross-region aggregation only for analytics, not UX-critical.

---

## Cost Controls (Follow-up)
- Limit **max concurrent subscriptions** per user/org.
- Throttle cursor messages server-side to ≤10Hz; coalesce to last-write-wins per 100ms window.
- Drop inactive sockets quickly (no heartbeat > 30s).
- Use **binary frames** for hot paths (e.g., compact JSON or MessagePack) to cut egress.

---

## Quick Study TL;DR
- WebSocket gateway + Redis/Kafka. Presence = ephemeral (Redis), edits = durable (Kafka or DB) with ordered per-doc streams.  
- Idempotency via `{docId}:{clientId}:{seq}`; server assigns monotonically increasing `version`.  
- Reconnect uses `fromVersion` + snapshot+delta backfill.  
- Enforce auth on subscribe; apply backpressure both ways; keep cursor updates throttled.
