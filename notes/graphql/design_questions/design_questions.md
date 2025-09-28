

### 1) Playlist Service (MySQL/Postgres + PHP)

You’re designing a GraphQL API for a music app: users, playlists, tracks, likes.

* **Requirements:** list a user’s playlists with track previews; add/remove tracks; search tracks; show “liked by me.”
* **Constraints:** PHP 8.x, MySQL/Postgres, Redis available; traffic bursts during commute hours.
* **Challenges to address:** N+1 avoidance, pagination choice, authZ (owner vs collaborator), search strategy, caching.
* **Deliverables:** schema (Query/Mutation/types), resolver strategy, SQL/index plan, caching plan, error model.
* **Lightning follow-ups:** soft deletes vs hard deletes; optimistic UI support; rate limiting per user.


### 2) GraphQL on Top of Legacy REST

You must wrap three flaky REST services (Users, Orders, Inventory) behind one GraphQL endpoint.

* **Requirements:** single query to fetch an order with purchaser and item stock; retries/backoff on 5xx; partial data ok.
* **Constraints:** 300ms p95 budget; REST services have different auth tokens.
* **Challenges:** batching REST calls, error surfaces (data + errors), timeouts/circuit breakers, per-field caching.
* **Deliverables:** schema, resolver data-flow diagram, cache keys and TTLs, error policy, circuit breaker thresholds.
* **Lightning follow-ups:** request deduping; fragment-based caching; schema evolution when REST adds fields.

### 3) Multi-Tenant SaaS with Row-Level Security

Build GraphQL for a B2B notes app: organizations, users, notes, tags. Tenants must be isolated.

* **Requirements:** users can only access org-scoped data; admins can invite users; audit who accessed what.
* **Constraints:** PHP backend; Postgres with RLS preferred; JWT with org_id and roles.
* **Challenges:** authN vs authZ boundaries, enforcing RLS in resolvers, field-level permissions, query complexity limits.
* **Deliverables:** schema w/ custom directives for authZ, RLS policy outline, context construction, complexity rules.
* **Lightning follow-ups:** per-tenant rate limits; exporting data safely; testing permissions.

### 4) Realtime Collab via Subscriptions

Add live presence and document updates using GraphQL subscriptions.

* **Requirements:** broadcast cursor position and edits to collaborators; backfill history on reconnect.
* **Constraints:** PHP app server; a separate websocket gateway is allowed; Redis or Kafka available.
* **Challenges:** subscription transport choice, scaling fan-out, idempotency of events, ordering guarantees.
* **Deliverables:** subscription schema, pub/sub topology, backpressure plan, reconnect/resume strategy.
* **Lightning follow-ups:** auth on subscribe; multi-region fan-out; cost controls for noisy clients.

### 5) File Uploads + Media Pipeline

Expose a GraphQL mutation to upload images and request renditions (thumb, webp).

* **Requirements:** large files; virus scanning; async processing; clients poll or subscribe for status.
* **Constraints:** S3-like storage; PHP API; background workers; CDN.
* **Challenges:** upload protocol (multipart vs signed URLs), mutation shape for async jobs, securing URLs, cache invalidation.
* **Deliverables:** mutations and job status types, storage/queue flow, lifecycle of a media object, CDN caching plan.
* **Lightning follow-ups:** retryable jobs; deduping identical uploads; access logs per tenant.

### 6) Federation/Modularization Strategy

Your company has three teams (Accounts, Catalog, Payments). Decide how to split the GraphQL surface.

* **Requirements:** one graph for clients; independent team deploys; type references across domains.
* **Constraints:** PHP for Accounts; Node for Catalog; Go for Payments.
* **Challenges:** schema ownership, composition/federation vs stitched gateways, cross-service auth context, versioning.
* **Deliverables:** ownership map, gateway plan, shared scalars/conventions, failure isolation + fallbacks.
* **Lightning follow-ups:** rolling schema changes; deprecations; contract tests across teams.

### 7) Performance & Cost Tuning

You inherited a slow GraphQL endpoint that times out under peak.

* **Requirements:** reduce p95 latency by 40% and DB load by 30% without breaking clients.
* **Constraints:** PHP FPM; Postgres; limited budget; traffic spiky.
* **Challenges:** hot resolvers, resolver waterfalling, DataLoader effectiveness, caching hierarchy (per-field, per-query), persisted queries/CDN.
* **Deliverables:** profiling plan, prioritized fixes, cache strategy (keys/TTLs/invalidation), persisted query rollout.
* **Lightning follow-ups:** precomputation/materialized views; stale-while-revalidate; experiment guardrails.

### 8) Search + Pagination Semantics

Implement search across articles with filters (author, tags, date) and reliable pagination.

* **Requirements:** stable pagination under inserts; deep scroll; counts for facets; highlight snippets.
* **Constraints:** DB search first; can add OpenSearch/Meilisearch later.
* **Challenges:** offset vs cursor, relay connections, deterministic sort keys, exposing totalCount safely, result caching.
* **Deliverables:** search query shape, connection types, sort+cursor design, migration plan to external search.
* **Lightning follow-ups:** filtering on nested relations; empty vs null semantics; faceted counts performance.

### 9) Error Model & Observability

Define a consistent error and logging approach across the graph.

* **Requirements:** clients want typed errors; SRE needs traceability; PII must be scrubbed.
* **Constraints:** mixed legacy code; compliance rules.
* **Challenges:** GraphQL “errors” array vs data, extensions codes, correlation IDs, tracing resolvers, redaction.
* **Deliverables:** error taxonomy, extensions format, logging/tracing plan (per field), test strategy for errors.
* **Lightning follow-ups:** partial failures UX; retry hints; SLOs per operation.

### 10) Schema Governance & Breaking Changes

Create a policy to evolve the schema safely as teams grow.

* **Requirements:** avoid breaking mobile clients; enable quick iteration; deprecation lifecycle.
* **Constraints:** multiple backends; federated or monolithic gateway.
* **Challenges:** linting, schema registries, contract tests, deprecation windows, persisted operation checks.
* **Deliverables:** governance doc, CI checks, deprecation timelines, rollout and rollback plan.
* **Lightning follow-ups:** consumer-driven contracts; change advisory reviews; versioning red lines.

Use these to practice designing out loud: sketch the schema, then walk through resolver flows, data stores, caching, auth, pagination, and failure modes. When you’re ready, pick any scenario and we’ll do a timed dry-run with you acting as the candidate.
