# 10) Schema Governance and Breaking Changes

Policy to evolve the schema safely as teams grow.

---

## Principles

- Prefer additive changes; avoid major versioning.  
- Changes that remove or narrow are breaking and require a deprecation window.  
- All schema diffs must pass linting, registry composition, and persisted operation checks.

---

## Deprecation Lifecycle

1) Add new field as nullable and keep old.  
2) Mark old with @deprecated(reason, since).  
3) Provide migration notes and sample queries.  
4) Maintain for at least 90 days or 3 mobile releases.  
5) Remove after data shows usage near zero.

---

## CI and Registry

- graphql-schema-linter for naming and descriptions.  
- GraphQL Inspector for breaking change detection.  
- Apollo or Hive registry for composition and contract checks.  
- Persisted operation validation against new schema in CI.

---

## Rollout and Rollback

- Feature flags in resolvers/services.  
- Canary by small percent of traffic; monitor p95 and error rate.  
- Have a rollback plan for both gateway and subgraph changes.

---

## Consumer-Driven Contracts (Lightning)

- Key consumers register their queries as contracts. Changes that break them block until migrations are ready.

---

## Versioning Red Lines (Lightning)

- Do not change nullability from nullable to non-nullable for existing fields.  
- Do not repurpose enum semantics; add new values instead.  
- Avoid QueryV2; add fields and types instead.

---

# Questions

- Is "Policy to evolve the schema safely as teams grow." an agreed upon document by engieers or a policy directive
- Where do "Provide migration notes and sample queries." live?
- Is `graphql-schema-linter` an official library?
- I need more info on:
    - Apollo or Hive registry for composition and contract checks.
    - Persisted operation validation against new schema in CI.
- What does "canary" mean? "Canary by small percent of traffic"