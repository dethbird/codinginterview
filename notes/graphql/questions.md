Perfect prep strategy. Here’s a solid spread of GraphQL interview questions, starting from basics and moving into scenarios where PHP backends are involved. I’ll just list them—no answers:

1. What problem does GraphQL aim to solve compared to REST APIs?
2. In GraphQL, what are the main operation types and how are they used?
3. How does GraphQL handle over-fetching and under-fetching compared to REST?
4. What is a resolver, and how does it map to fields in a schema?
5. How would you secure a GraphQL API against malicious or overly complex queries?
6. What’s the difference between a schema-first and a code-first GraphQL server implementation?
7. In GraphQL, how are relationships (e.g. User → Posts) typically represented and resolved?
8. How would you implement pagination in GraphQL? (cursor vs. offset)
9. How does GraphQL handle errors—what’s unique about its error reporting format?
10. What is the “N+1 query problem” in GraphQL, and how would you address it?
11. How can you combine GraphQL with a relational database like MySQL or Postgres in a PHP backend?
12. How would you expose existing REST endpoints through a GraphQL layer?
13. What are fragments in GraphQL, and why would a client use them?
14. How does GraphQL handle versioning compared to REST?
15. What are subscriptions in GraphQL and when would you use them?
16. How would you implement authentication and authorization in a GraphQL API?
17. How do you enforce query complexity limits to protect performance?
18. Can GraphQL be cached like REST endpoints? If so, how would you design that?
19. How would you test GraphQL resolvers and schema in a PHP backend?
20. What’s one drawback of GraphQL that engineers should be aware of before adopting it?

Perfect — here’s a **one-liner cheat sheet** for each of the 20 GraphQL interview questions we’ve walked through. These are short, memorable capsules you can expand on if asked:

---

### 1. Problem GraphQL solves vs REST

“GraphQL lets clients avoid over-fetching and under-fetching by querying exactly the fields they need in a single request, instead of juggling multiple rigid REST endpoints.”

### 2. Operation types

“Three ops: `query` (read), `mutation` (write), and `subscription` (real-time updates via persistent connection).”

### 3. Over/under-fetching

“In REST you often fetch too much or make multiple calls; GraphQL lets clients ask for just the fields they need, nested, in one query.”

### 4. Resolvers

“Resolvers are functions that map schema fields to data sources; they take (parent, args, context, info) and execute top-down along the query tree.”

### 5. AuthN vs AuthZ

“AuthN = who are you (JWT, session); AuthZ = what are you allowed to do (check roles/tenant in context at operation, field, and row level).”

### 6. Subscriptions

“Subscriptions keep a persistent connection (usually WebSocket) so the server can push live events — great for chat, notifications, dashboards.”

### 7. ReactPHP

“ReactPHP is an event-driven PHP library with an event loop, letting you build long-lived async servers like WebSockets for GraphQL subscriptions.”

### 8. Schema-first vs Code-first

“Schema-first: write SDL, then resolvers (good for contract review); Code-first: define types in code, schema is generated (good for strong refactor safety).”

### 9. Relationships (User → Posts)

“Defined as nested fields in SDL, resolved by child resolvers using the parent object — often with batching or joins to avoid N+1.”

### 10. Pagination

“Offset pagination is simple but unstable/slow for big data; cursor pagination uses opaque cursors from sort keys for stable, efficient infinite scroll.”

### 11. Error handling

“GraphQL always returns a `data` object and an `errors` array; errors identify the path/field so clients can get partial data plus precise error info.”

### 12. N+1 problem

“N+1 is one parent query + N child queries; fix with batching (DataLoader, IN queries) or sometimes with a single JOIN for shallow shapes.”

### 13. GraphQL + relational DB

“Resolvers run SQL directly against MySQL/Postgres (via PDO/ORM), mapping schema to DB relations, with loaders/pagination for performance.”

### 14. Wrapping REST in GraphQL

“Resolvers call REST endpoints instead of SQL, batching/caching where possible, and map REST errors into GraphQL’s error array.”

### 15. Fragments

“Fragments are reusable sets of fields clients can spread across queries for consistency and cache normalization; inline fragments handle unions/interfaces.”

### 16. Versioning

“REST versions endpoints (`/v1/` vs `/v2/`); GraphQL evolves one schema: add new fields, deprecate old ones with `@deprecated`, avoid breaking changes.”

### 17. Security: query complexity

“Protect performance with validation rules (max depth/complexity, require pagination), execution limits (timeouts, batch caps), and ops limits (rate limiting, persisted queries).”

### 18. Caching

“GraphQL caching is layered: client-side normalization (Apollo/Relay), persisted queries for CDN GET caching, and server/field caches in Redis with TTLs + invalidation.”

### 19. Testing

“Test resolvers with PHPUnit (unit with mocks, integration with DB, schema snapshot tests, HTTP integration, and validation rule tests).”

### 20. Drawbacks

“GraphQL adds schema governance overhead, needs extra work for caching and query control, and can be overkill for small/simple apps.”

---
