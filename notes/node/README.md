# Node notes

## 01 Runtime Basics

Foundations of running JavaScript on Node: how the event loop works, module systems, project metadata, and adding TypeScript.

### [Event Loop](./01-runtime-basics/event-loop.md)

Explains phases, microtasks vs macrotasks, starvation pitfalls, and how `await`, `nextTick`, and I/O interplay in real apps.

### [ESM vs CJS Modules](./01-runtime-basics/modules-esm-vs-cjs.md)

When to use ESM vs CommonJS, interop gotchas, file extensions, `type: module`, and migration strategies.

### [package.json & npm](./01-runtime-basics/package-json-and-npm.md)

Key fields (`scripts`, `dependencies`, `exports`, `engines`), semantic versioning, and reproducible installs (`npm ci`).

### [TypeScript in Node](./01-runtime-basics/typescript-in-node.md)

Compiler options that matter, ESM-friendly configs, path aliases, and running TS with `tsx`/`ts-node`.

------

## 02 Async Patterns

How Node handles concurrency: callbacks, promises, timers, scheduling, and practical cancellation.

### [Callbacks → Promises → async/await](./02-async-patterns/callbacks-promises-async-await.md)

Converting callbacks, error handling patterns, and composing async flows without pyramids of doom.

### [Timers, `process.nextTick`, `setImmediate`](./02-async-patterns/timers-nexttick-setimmediate.md)

Differences, ordering rules, and when to prefer each for responsiveness.

### [Parallel vs Series](./02-async-patterns/parallel-vs-series.md)

Running tasks with concurrency limits, batching I/O safely, and avoiding overload.

### [AbortController & Cancellation](./02-async-patterns/abortcontroller-cancellation.md)

Cancel fetch/axios/streams, tie to request lifecycles, and time-box upstream calls.

------

## 03 Core Modules

Daily-driver Node APIs for files, networking, buffers, processes, and child tasks.

### [fs & path](./03-core-modules/fs-path.md)

Reading/writing safely, streams vs buffers, glob pitfalls, and portable paths.

### [url & querystring](./03-core-modules/url-and-querystring.md)

Parsing/formatting URLs, query params, and avoiding manual string hacks.

### [events & EventEmitter](./03-core-modules/events-and-eventemitter.md)

Emitter patterns, memory leaks (listeners), and once/cleanup techniques.

### [Buffer & TypedArrays](./03-core-modules/buffer-and-typedarrays.md)

Binary data basics, encoding, and zero-copy operations.

### [Streams (basics)](./03-core-modules/streams-basics.md)

Readable/Writable/Transform streams, backpressure, and piping.

### [http & https](./03-core-modules/http-https.md)

Raw servers/clients, headers, keep-alive, and timeouts.

### [os & process](./03-core-modules/os-and-process.md)

Env, signals, resource limits, and introspecting the runtime.

### [child_process](./03-core-modules/child-process.md)

Spawn/exec/fork, stdio piping, and job control.

------

## 04 Files & Streams

Working with large files efficiently and transforming data in flight.

### [Streaming Read/Write](./04-files-and-streams/streaming-read-write.md)

Use `pipeline`, handle errors, and avoid loading whole files in memory.

### [Piping & Backpressure](./04-files-and-streams/piping-and-backpressure.md)

Designing stable pipelines, buffering thresholds, and high-water marks.

### [Transform Streams](./04-files-and-streams/transform-streams.md)

Build transforms for compression, parsing, and throttling.

### [CSV & JSONL Examples](./04-files-and-streams/csv-jsonl-examples.md)

Realistic ETL snippets for CSV↔JSONL and line-by-line processing.

------

## 05 Networking & APIs

From raw HTTP to Express apps with validation, security, and uploads.

### [HTTP Server from Scratch](./05-networking-and-apis/http-server-from-scratch.md)

Routing by hand, parsing bodies, and understanding what frameworks abstract.

### [Express Basics & Routing](./05-networking-and-apis/express-basics-routing.md)

Routers, params, middleware order, and structuring controllers.

### [Middleware & Error Handling](./05-networking-and-apis/middleware-and-error-handling.md)

Centralized error mappers, async wrappers, and request IDs.

### [Validation (Zod/Joi)](./05-networking-and-apis/validation-zod-joi.md)

Schema validation at the edge, coercion, and readable error responses.

### [CORS, Rate Limit, Helmet](./05-networking-and-apis/cors-rate-limit-helmet.md)

Secure defaults for browsers, abuse mitigation, and headers.

### [File Uploads (busboy/multer)](./05-networking-and-apis/file-uploads-busboy-multer.md)

Streaming uploads, size limits, temp storage, and cloud offload patterns.

------

## 06 Databases

Connecting to SQL/NoSQL, modeling data, and keeping migrations sane.

### [Postgres (`pg`)](./06-databases/postgres-pg.md)

Pools, transactions, parameterized queries, and performance tips.

### [MySQL (`mysql2`)](./06-databases/mysql-mysql2.md)

Connections, timeouts, and common quirks vs Postgres.

### [MongoDB & Mongoose](./06-databases/mongodb-mongoose.md)

Schemas, indexing, lean docs, and aggregation basics.

### [ORMs (Prisma/Knex)](./06-databases/orm-prisma-knex.md)

When to use each, migrations, and querying patterns.

### [Migrations & Seeding](./06-databases/migrations-and-seeding.md)

Versioning schema changes, safe rollouts, and seed data strategies.

### [Transactions & Pooling](./06-databases/transactions-and-pooling.md)

ACID with ORMs/drivers, isolation levels, and sizing pools.

------

## 07 Auth & Security

User auth and app hardening: passwords, sessions, tokens, and input safety.

### [Password Hashing](./07-auth-and-security/password-hashing.md)

bcrypt/argon2 choices, peppering, and rehash policies.

### [JWT vs Sessions](./07-auth-and-security/jwt-vs-sessions.md)

Trade-offs, token storage, rotation, and invalidation.

### [OAuth2 Notes](./07-auth-and-security/oauth2-notes.md)

Auth code flow, PKCE, scopes, and refresh tokens.

### [Cookies & CSRF](./07-auth-and-security/cookies-and-csrf.md)

SameSite/Secure/HttpOnly flags and CSRF defenses.

### [Input Sanitization & Vulns](./07-auth-and-security/input-sanitization-and-vulns.md)

Avoiding injection/XSS, safe parsers, and output encoding.

------

## 08 Testing & Quality

Confident changes via fast tests, mocks, and lint/type gates.

### [Jest/Vitest Setup](./08-testing-and-quality/jest-vitest-setup.md)

Config, TS support, watch mode, and running in CI.

### [Supertest (HTTP tests)](./08-testing-and-quality/supertest-http-tests.md)

Black-box route testing without binding a port.

### [Mocking & Test Doubles](./08-testing-and-quality/mocking-and-test-doubles.md)

Spies, fakes, dependency injection, and boundaries.

### [Coverage & Thresholds](./08-testing-and-quality/coverage-and-thresholds.md)

Measuring the right things and failing builds on regressions.

### [ESLint & Prettier](./08-testing-and-quality/eslint-prettier-setup.md)

Consistent style, import rules, and CI enforcement.

------

## 09 Logging & Monitoring

Know what’s happening in prod: logs, metrics, and traces.

### [Pino & Winston](./09-logging-and-monitoring/pino-winston.md)

Structured logs, redaction, and child loggers.

### [HTTP Logging (morgan)](./09-logging-and-monitoring/http-logging-morgan.md)

Request logs with IDs and latency, plus pitfalls to avoid.

### [Metrics (Prometheus)](./09-logging-and-monitoring/metrics-prometheus.md)

Counters, gauges, histograms, and useful app KPIs.

### [Tracing (OpenTelemetry)](./09-logging-and-monitoring/tracing-opentelemetry.md)

Distributed traces, context propagation, and exporters.

------

## 10 Performance & Scalability

Profile, parallelize, cache, and queue work without melting servers.

### [Profiling & Benchmarks](./10-performance-and-scalability/profiling-and-benchmarks.md)

CPU/heap profiling, flamegraphs, and micro-benchmarks.

### [Worker Threads vs Cluster](./10-performance-and-scalability/worker-threads-vs-cluster.md)

When to use each, IPC, and debugging multi-process apps.

### [Redis Caching](./10-performance-and-scalability/redis-caching.md)

Key design, TTLs, JSON caches, and cache stampede control.

### [Queues (BullMQ)](./10-performance-and-scalability/queues-bullmq.md)

Background jobs, retries/backoff, and dead-letter patterns.

------

## 11 Devtools & Debugging

Speed up feedback loops and fix bugs faster.

### [node --inspect & DevTools](./11-devtools-and-debugging/node-inspect-and-devtools.md)

Attaching debuggers, breakpoints, and heap snapshots.

### [VS Code Debug Config](./11-devtools-and-debugging/vscode-debug-config.md)

Launch/attach setups, sourcemaps, and hit breakpoints reliably.

### [Nodemon & Reloaders](./11-devtools-and-debugging/nodemon-and-reloaders.md)

Watchers, graceful restarts, and Docker/WSL polling tips.

### [ts-node & tsx](./11-devtools-and-debugging/ts-node-tsx.md)

Run TS directly, loaders, and type-check strategies.

------

## 12 Deployment & Ops

Ship reliably: configs, processes, containers, and pipelines.

### [Env Config & dotenv](./12-deployment-and-ops/env-config-dotenv.md)

12-factor envs, Zod validation, examples, and secrets strategy.

### [PM2 & systemd](./12-deployment-and-ops/pm2-and-systemd.md)

Process supervision, clustering, and graceful reloads.

### [Docker Basics](./12-deployment-and-ops/docker-basics.md)

Multi-stage builds, small images, healthchecks, and dev compose.

### [CI/CD Tips](./12-deployment-and-ops/ci-cd-tips.md)

GitHub Actions patterns, caches, artifacts, and deployments.

------

## 13 Realtime

Push updates to clients with persistent connections.

### [WebSockets with `ws`](./13-realtime/websockets-ws.md)

Upgrade flow, auth on upgrade, heartbeats, and backpressure.

### [Socket.IO](./13-realtime/socket-io.md)

Namespaces/rooms, acks, reconnection, and Redis adapter scaling.

------

## 14 GraphQL & RPC

Typed APIs beyond REST: schemas or end-to-end TS.

### [Apollo Server Basics](./14-graphql-and-rpc/apollo-server-basics.md)

Schema/resolvers/context, DataLoader, and depth/complexity limits.

### [tRPC Notes](./14-graphql-and-rpc/trpc-notes.md)

Routers/procedures, Zod validation, React Query, and WS subs.

### [gRPC Quickstart](./14-graphql-and-rpc/grpc-quickstart.md)

Proto contracts, unary/streaming calls, deadlines, and metadata.

------

## 15 Patterns & Architecture

Keep business logic clean and testable; swap infra without pain.

### [Layered & Clean Architecture](./15-patterns-and-architecture/layered-and-clean-architecture.md)

Entities/use-cases/ports, adapters, and composition roots.

### [Dependency Injection](./15-patterns-and-architecture/dependency-injection.md)

Manual DI, containers, lifecycles, and request scope.

### [Configuration Strategy](./15-patterns-and-architecture/config-strategy.md)

Typed config, precedence rules, slicing, and feature flags.

### [Error Handling Patterns](./15-patterns-and-architecture/error-handling-patterns.md)

App errors, mapping to edges, retries/timeouts, and logging.

------

## 16 Interview Cheatsheets

Drop-in snippets, pitfalls to avoid, and a ready starter API.

### [Quick Snippets](./16-interview-cheatsheets/quick-snippets.md)

Copy/paste helpers for Express, JWTs, axios, Redis, queues, etc.

### [Common Gotchas](./16-interview-cheatsheets/common-gotchas.md)

The mistakes that trip candidates and how to fix them fast.

### [API Starter Template](./16-interview-cheatsheets/api-starter-template.md)

A minimal, production-sane Express + TS skeleton with tests and Docker.