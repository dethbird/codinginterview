# 2) GraphQL on Top of Legacy REST

## Scenario
Three flaky REST services behind one GraphQL endpoint:
- **Users** (auth token A)
- **Orders** (auth token B)
- **Inventory** (auth token C)

Single query should return an order with purchaser info and per-item stock. Partial data is OK. **p95 ≤ 300 ms**.

---

## GraphQL Schema (SDL)
```graphql
scalar ISO8601

type Query {
  order(id: ID!): Order
}

type Order {
  id: ID!
  purchaser: User
  items: [OrderItem!]!
  createdAt: ISO8601!
  status: OrderStatus!
}

type OrderItem {
  sku: ID!
  quantity: Int!
  stock: StockInfo
}

type User {
  id: ID!
  email: String
  displayName: String
}

type StockInfo {
  sku: ID!
  available: Int
  lastUpdated: ISO8601
}

enum OrderStatus { PENDING FULFILLED CANCELLED }
```
Design notes: purchaser/stock nullable for **partial-data** semantics.

---

## Resolver Data-Flow
```
Client -> GraphQL Gateway
  └─ order(id)
       ├─ GET /orders/{id}            (token B) [deadline ~150ms]
       │     ↳ userId, items[{sku, quantity}]
       ├─ UsersLoader.load(userId)     (GET /users?ids=...) [~100ms]
       └─ StockLoader.loadMany(skus)   (GET /inventory?skus=...) [~100ms]
```
Fetch order first; then **parallelize** users & inventory via **DataLoaders** (batching + per-request cache).

---

## PHP Resolver Sketch (Guzzle + DataLoader)
```php
$orders = $container->get(OrdersClient::class);   // token B
$users  = $container->get(UsersClient::class);    // token A
$inv    = $container->get(InventoryClient::class);// token C

$usersLoader = new DataLoader(fn(array $ids) => $users->getMany($ids));     // GET /users?ids=
$stockLoader = new DataLoader(fn(array $skus) => $inv->getStockMany($skus)); // GET /inventory?skus=

function resolveOrder($_, $args) use ($orders) { return $orders->getById($args['id']); }
function resolveOrder_purchaser($order) use ($usersLoader) { return $usersLoader->load($order['userId']); }
function resolveOrder_items($order) { return $order['items']; }
function resolveOrderItem_stock($item) use ($stockLoader) { return $stockLoader->load($item['sku']); }
```
All clients enforce timeouts, retries w/ jitter, and circuit-breakers.

---

## Timeouts, Retries, Budgets
- Global p95: **300 ms**.
- Timeouts (connect+read): Orders **150 ms**, Users **100 ms**, Inventory **100 ms**.
- Retries: **≤1** on idempotent GET for 5xx / timeouts / connect reset; **exponential backoff + jitter 20-40 ms**.
- Propagate **deadline**: header `X-Request-Deadline: <ms_remaining>`.

---

## Circuit Breakers (per endpoint)
- Window: last **20-50** calls; Open if failure-rate ≥ **50%** with ≥ **10** requests.
- Open for **20s**, then half-open with **3** trial requests.
- Fallbacks: serve **stale cache** (Users ≤ 5 min; Inventory ≤ 30 s) or `null` + typed error.

---

## Caching
**Layers**
1) In-process + Redis HTTP cache  
   - Users: key `users:by-ids:v1:{sha1(sortedIds)}`, **TTL 300 s**, **SWR 60 s**.  
   - Inventory: key `inventory:stock:v1:{sha1(sortedSkus)}`, **TTL 10 s**, **SWR 5 s**.  
   - Orders: **no cache** (or tiny TTL 3-5 s if domain allows).
2) DataLoader per-request cache.
3) Optional **edge caching** for **persisted queries** (vary by auth).

**Invalidation**
- On user update: delete `user:{id}` + batch keys (track reverse index).  
- On stock webhook: delete `stock:{sku}` + batch keys.

---

## Auth & Headers
- Each downstream uses its own service token (A/B/C) from secret store.  
- Always include: `X-Request-Id`, `X-Request-Deadline`, `X-Client`.

---

## Error Model (partial data)
Return partial data with `errors[]` entries that include **path** and **extensions**:
```json
{
  "message": "Inventory timeout",
  "path": ["order","items",0,"stock"],
  "extensions": {
    "code": "INVENTORY_TIMEOUT",
    "service": "inventory",
    "httpStatus": 504,
    "requestId": "…",
    "retryable": true
  }
}
```
PII scrubbing: whitelist-only logging of downstream bodies.

---

## Observability
- Resolver timings per field; downstream spans (endpoint, status, latency, retries, breaker state).
- Alerts: p95(Query.order) > 300 ms; breaker-open rate > 10%; retry rate spike > baseline+3σ.

---

## Batching
- **UsersLoader**: unique userIds across request.  
- **StockLoader**: unique SKUs across request.  
- Stable mapping by key; missing entries → `null` + error.

---

## Gateway Hardening
- Input validation (id/sku length & regex).
- Query depth/complexity limits.
- Persisted ops for cache + WAF allowlists.

---

## Concrete Numbers to Quote
- Timeouts: 150/100/100 ms; Retries: ≤1 with jitter 20-40 ms.  
- Breaker: ≥50% failures over ≥10 reqs, open 20 s, half-open 3 trials.  
- TTLs: Users 300 s (SWR 60 s), Inventory 10 s (SWR 5 s).

---

## Lightning Follow-ups
**Request deduping**: DataLoader in-request; Redis singleflight across requests (50-100 ms window).  
**Fragment caching**: per-entity server keys align with client normalized cache (`User:{id}`, `StockInfo:{sku}`).  
**Schema evolution**: add fields **nullable** behind flag; deprecate before removal (60-90 days window).
