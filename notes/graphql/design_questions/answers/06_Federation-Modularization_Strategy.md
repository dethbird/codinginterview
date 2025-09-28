# 6) Federation / Modularization Strategy

Teams: Accounts (PHP), Catalog (Node), Payments (Go). One graph for clients; independent deploys; types referenced across domains.

---

## Approach
Use an Apollo Federation style setup with a gateway that composes subgraphs. Accounts can ship a PHP subgraph; Catalog and Payments ship Node/Go subgraphs.

Benefits: clear ownership, independent deploys, cross-entity references, central composition checks.

---

## Ownership Map (example)
- Accounts owns User, Organization, Auth mutations.
- Catalog owns Product, Variant, Search; may extend User with reviewed counts.
- Payments owns Invoice, PaymentMethod, Subscription; may extend User with defaultPaymentMethod.

---

## Gateway Plan
- Apollo Router (Rust) or Apollo Gateway (Node). Enable timeouts, retries, circuit breakers, query plan cache.
- Registry (Apollo or GraphQL Hive) holds subgraph SDLs and runs composition checks.

---

## Shared Conventions
- Scalars: ISO8601, Currency, URL, Email.
- Pagination: consistent connections or seek cursors.
- Errors: extensions.code and requestId shape standardized.

---

## Cross-Service Auth
- Gateway validates client token once, forwards a signed internal token with sub/org/roles/requestId to subgraphs.
- Subgraphs do not trust raw client tokens.

---

## Failure Isolation and Fallbacks
- Per-subgraph concurrency and circuit breakers.
- Partial data tolerated for non-critical fields; critical roots can fall back to cached slices when safe.

---

## Versioning and Deprecations
- Add fields as nullable; deprecate old ones with a 60-90 day window.
- Contract tests via persisted operations ensure clients are not broken.

---

## Lightning
Rolling schema changes: canary the subgraph, then the gateway.  
Deprecations: documented in registry with removal dates.  
Contract tests across teams: validate consumers' persisted operations in CI.
