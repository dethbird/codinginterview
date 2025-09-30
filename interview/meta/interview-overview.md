Meta’s interviews have a distinct flavor: they’ll definitely hit you with algorithm/data structure questions (Big-O reasoning, sorting, graph traversals, hashing, recursion, etc.), but because you’re interviewing as a software engineer with PHP/GraphQL emphasis, you can expect more than just LeetCode-style puzzles.

Here’s what tends to show up in their pipeline:

**1. Core algorithms & complexity**

* Big-O and space/time tradeoffs (hash maps vs arrays, BFS vs DFS, etc.).
* Classic problems: reversing linked lists, detecting cycles, top-k elements, interval merges, graph shortest path, string manipulation.
* Expect to justify *why* your solution scales and compare alternatives.

**2. Systems & API design**

* You may be asked to sketch a GraphQL or REST API schema for a feature (e.g. “design an API for a playlist app”).
* Data modeling tradeoffs: how to avoid N+1 queries, how to cache resolvers, pagination choices (cursor vs offset).
* Scalability: caching tiers, consistency vs availability, and how to handle fan-out in subscriptions.
* They might give you an open-ended “design Messenger’s read receipts” type prompt.

**3. PHP / Hack / backend knowledge**

* Even if you aren’t expected to know Hack deeply, be ready to talk about PHP 8.x typing, async patterns (Fibers vs Generators), dependency injection, error handling.
* How you’d structure a large PHP service (namespace usage, autoloading, PSR standards).
* Secure coding (SQL injection, XSS, CSRF, escaping pitfalls).

**4. GraphQL-specifics**

* N+1 problem and data loaders.
* Schema evolution: how to deprecate fields without breaking clients.
* Subscriptions: how you’d scale real-time updates (Redis/Kafka/WebSockets).
* Query cost analysis and limiting expensive queries.
* Federation vs schema stitching (especially since Meta pushes federated graphs internally).

**5. General software engineering**

* Testing philosophy: doubles, mocks, and how you’d test GraphQL resolvers or async code.
* Debugging skills: spotting race conditions, handling retries, fault isolation.
* Deployment/ops: feature flags, rollback strategy, monitoring/logging.

**6. Meta-flavored behavioral**

* They like to dig into how you “execute” (get things done), how you deal with incomplete specs, and how you collaborate.
* Expect questions like: “Tell me about a time you shipped something under vague requirements.”
* They probe for bias toward action and ability to simplify.

So: brush up on LeetCode-style problems (graphs, dynamic programming, string/array manipulation), but also be ready to whiteboard an API schema, explain your approach to caching/resolvers, and defend your tradeoffs.

If you want, I can spin up a mock “Meta-style” question set tailored to your PHP/GraphQL angle (one coding, one design, one behavioral) so you can practice in the same rhythm you’ll face. Want me to do that?
