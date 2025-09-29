# 7) Performance and Cost Tuning

Goal: reduce p95 latency by 40 percent and DB load by 30 percent without breaking clients. Stack: PHP-FPM, Postgres, Redis. Traffic is spiky.

---

## Profiling Plan
- Field timing per resolver; top slow operations.
- Postgres pg_stat_statements for heavy SQL.
- Redis and CDN cache hit ratios.
- Sample trace storage with OpenTelemetry.

---

## Prioritized Fixes
1) Replace resolver waterfalls with DataLoader batching.  
2) Switch offset pagination to seek cursors.  
3) Add composite indexes matching common filters and sorts.  
4) Precompute aggregates via materialized views refreshed every N minutes.  
5) Narrow SELECT projections to required columns.  
6) Memoize pure helper functions per request.

---

## Caching Hierarchy
- Edge CDN for public reads using persisted queries.  
- Response cache for authenticated hot queries (TTL 10-60s, stale-while-revalidate).  
- Per-entity Redis keys like user:{id}:v{n}; bump version on writes.  
- Field cache for expensive computed fields.

Invalidation is event-driven where possible; versioned keys avoid large deletes.

---

## Persisted Queries
- Hash-based allowlist; improves edge cache hits and reduces attack surface.

---

## Database Load Reduction
- Use read replicas for heavy scans.  
- Use LIMIT with seek cursors; cap first.  
- Tune work_mem for sorts; avoid JSON processing in DB when possible.

---

## Cost Controls
- Concurrency caps per resolver.  
- Adaptive TTLs during spikes.  
- Batch windowing: wait 5-10 ms to increase DataLoader batch size.  
- Compress HTTP; consider messagepack over WS for hot paths.

---

## Guardrails
- Feature flags and canaries; SLOs per operation; rollback playbook.

---

# Questions

- how do you do per-field caching?  caching hierarchy (per-field, per-query)
- what is a "hot query"? "Response cache for authenticated hot queries (TTL 10-60s, stale-while-revalidate)."
- Can you explain "Tune work_mem for sorts; avoid JSON processing in DB when possible."