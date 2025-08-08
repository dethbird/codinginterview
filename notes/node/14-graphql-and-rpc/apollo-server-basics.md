**apollo-server-basics.md**

# Apollo Server Basics (GraphQL on Node)

## 📌 What & why

**GraphQL** exposes a typed schema so clients ask for exactly what they need. **Apollo Server (v4)** is a lightweight GraphQL HTTP server that you drop into **Express/Fastify**. Use it when you want **typed contracts**, **single endpoint**, and strong **tooling** (schema-first + resolvers).

------

## Install (ESM + Express)

```bash
npm i @apollo/server graphql express cors body-parser
# Nice-to-haves
npm i zod dataloader jsonwebtoken
```

------

## Minimal server (schema + resolvers + context)

```ts
// src/graphql/server.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import DataLoader from 'dataloader';

// 1) SDL schema
const typeDefs = /* GraphQL */ `
  type User { id: ID!, email: String!, name: String }
  type Post { id: ID!, title: String!, body: String!, author: User! }

  type PageInfo { endCursor: String, hasNextPage: Boolean! }
  type PostEdge { node: Post!, cursor: String! }
  type PostConnection { edges: [PostEdge!]!, pageInfo: PageInfo! }

  type Query {
    me: User
    post(id: ID!): Post
    posts(first: Int = 20, after: String): PostConnection!
  }

  input CreatePostInput { title: String!, body: String! }
  type Mutation {
    createPost(input: CreatePostInput!): Post!
    deletePost(id: ID!): Boolean!
  }
`;

// 2) Fake DB layer (replace with real repo/ORM)
const db = {
  usersById: new Map([['u1', { id: 'u1', email: 'a@b.com', name: 'Alice' }]]),
  posts: [
    { id: 'p1', title: 'Hello', body: 'World', authorId: 'u1' },
    { id: 'p2', title: 'Second', body: 'Post', authorId: 'u1' }
  ]
};

// 3) Context: per-request state (user, loaders, db)
type Ctx = {
  userId?: string;
  loaders: { userById: DataLoader<string, any> };
  db: typeof db;
};

function buildContext(token?: string): Ctx {
  let userId: string | undefined;
  if (token) {
    try { userId = (jwt.verify(token, process.env.JWT_SECRET!) as any).sub; }
    catch { /* invalid → anonymous */ }
  }
  const userById = new DataLoader<string, any>(async (ids) => {
    // batch & map
    return ids.map((id) => db.usersById.get(id) ?? null);
  });
  return { userId, loaders: { userById }, db };
}

// 4) Resolvers (parent, args, context, info)
const resolvers = {
  Post: {
    author: (parent: any, _args: any, ctx: Ctx) => ctx.loaders.userById.load(parent.authorId)
  },
  Query: {
    me: (_: any, __: any, ctx: Ctx) => (ctx.userId ? ctx.db.usersById.get(ctx.userId) : null),
    post: (_: any, args: { id: string }, ctx: Ctx) => ctx.db.posts.find(p => p.id === args.id) || null,
    posts: (_: any, args: { first?: number; after?: string }, ctx: Ctx) => {
      const first = Math.min(Math.max(args.first ?? 20, 1), 100); // clamp 1..100
      const from = args.after ? ctx.db.posts.findIndex(p => p.id === args.after) + 1 : 0;
      const slice = ctx.db.posts.slice(from, from + first);
      const end = slice[slice.length - 1];
      return {
        edges: slice.map(p => ({ node: p, cursor: p.id })),
        pageInfo: { endCursor: end?.id, hasNextPage: from + first < ctx.db.posts.length }
      };
    }
  },
  Mutation: {
    createPost: (_: any, args: { input: { title: string; body: string } }, ctx: Ctx) => {
      if (!ctx.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      // naive validation
      if (args.input.title.length < 1) throw new GraphQLError('Title required', { extensions: { code: 'BAD_USER_INPUT' } });
      const post = { id: 'p' + (ctx.db.posts.length + 1), ...args.input, authorId: ctx.userId };
      ctx.db.posts.push(post);
      return post;
    },
    deletePost: (_: any, { id }: { id: string }, ctx: Ctx) => {
      if (!ctx.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const idx = ctx.db.posts.findIndex(p => p.id === id && p.authorId === ctx.userId);
      if (idx === -1) return false;
      ctx.db.posts.splice(idx, 1);
      return true;
    }
  }
};

// 5) Wire Apollo → Express
export async function startGraphQLServer() {
  const apollo = new ApolloServer<Ctx>({ typeDefs, resolvers });
  await apollo.start();

  const app = express();
  app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
  app.use('/graphql', bodyParser.json(), expressMiddleware(apollo, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.replace(/^Bearer\s/i, '');
      return buildContext(token);
    }
  }));

  return app;
}
// src/server.ts
import http from 'node:http';
import { startGraphQLServer } from './graphql/server';

const app = await startGraphQLServer();
http.createServer(app).listen(3000, () => console.log('GraphQL on http://localhost:3000/graphql'));
```

------

## Resolver function signature (important in interviews)

```
(parent, args, context, info)
```

- **parent**: previous resolver result (object of the parent type).
- **args**: GraphQL args (validated by SDL types). Example: `{ id: "p1" }`.
- **context**: per-request bag (auth user, loaders, db clients).
- **info**: AST/field selection metadata (rarely needed; use for advanced cases).

------

## Input validation (beyond SDL) with Zod

```ts
import { z } from 'zod';
const CreatePost = z.object({ title: z.string().min(1).max(140), body: z.string().min(1) });

createPost: (_: any, { input }: any, ctx: Ctx) => {
  CreatePost.parse(input);
  // ...insert...
}
```

------

## Avoiding N+1 with **DataLoader**

Batch and cache child lookups per request. We did that for `Post.author`. Same idea for `commentsByPostId`, etc. Keep loaders **in context** so the cache resets each request.

------

## Error handling & masking

- Throw `GraphQLError(message, { extensions: { code } })` for client errors (`BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`).
- Let unexpected errors bubble; Apollo masks the message in prod. Log server-side details yourself.

```ts
throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
```

------

## Pagination (cursor pattern)

We returned a `PostConnection` with `edges { node, cursor }` + `pageInfo { endCursor, hasNextPage }`.
 In real DBs use an **opaque cursor** (e.g., base64 of `(created_at,id)`), not raw IDs.

------

## Caching & performance

- Enable Cache Hints: annotate resolvers with `cacheControl`.

```ts
// @ts-ignore - helper
resolvers.Query.post = (p, a, c, info) => {
  info.cacheControl.setCacheHint({ maxAge: 60, scope: 'PUBLIC' });
  return c.db.posts.find(x => x.id === a.id) || null;
};
```

- **APQ (Automatic Persisted Queries)**: reduces payload by hashing queries (typically handled at client/gateway; for server v4 add an APQ-compatible link at the client or front proxy).
- **HTTP caching**: cache GET requests for persisted queries via CDN.

------

## Security checklist

- Clamp `first/limit` and prefer **cursor** pagination.
- Rate-limit at the **HTTP** layer (IP/user), add **timeouts**.
- Add **depth/complexity** limits to stop expensive queries:

```ts
npm i graphql-depth-limit graphql-validation-complexity
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';
const apollo = new ApolloServer({
  typeDefs, resolvers,
  validationRules: [
    depthLimit(8),
    createComplexityLimitRule(1000, { scalarCost: 1, objectCost: 1 })
  ]
});
```

- Keep introspection on in dev; in prod you can leave it on (it’s harmless) or gate by auth if you must.

------

## Subscriptions (realtime)

Apollo Server v4 doesn’t ship a transport; pair with **graphql-ws**.

```bash
npm i graphql-ws ws
```

Sketch:

```ts
// create a WebSocketServer and use graphql-ws's useServer({ schema, execute, subscribe }, wsServer)
// Expose "subscription { postCreated { id title } }" in SDL and publish via an async iterator.
```

For many apps, consider **Socket.IO** for realtime and use GraphQL for querying/mutations.

------

## Testing (Supertest)

```ts
import request from 'supertest';
import { startGraphQLServer } from '@/graphql/server';

it('creates a post', async () => {
  const app = await startGraphQLServer();
  const res = await request(app)
    .post('/graphql')
    .set('authorization','Bearer test.jwt') // your signed test JWT
    .send({ query: 'mutation($input:CreatePostInput!){ createPost(input:$input){ id title } }',
            variables: { input: { title: 'T', body: 'B' } } })
    .expect(200);
  expect(res.body.data.createPost.title).toBe('T');
});
```

------

## Client snippet (fetch)

```ts
const q = `query($id:ID!){ post(id:$id){ id title author { email } } }`;
const res = await fetch('/graphql', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query: q, variables: { id: 'p1' } })
});
const data = await res.json();
```

------

## Real-world structure

```
src/graphql/
  schema.ts        # SDL (string) or code-first (Nexus)
  resolvers/
    Query.ts
    Mutation.ts
    Post.ts
  context.ts       # auth, loaders, db clients
  server.ts        # Apollo wiring (plugins, validation rules)
```

------

## ✅ Interview Tips

- Define **resolver signature** and **context** clearly.
- Mention **DataLoader** to fix N+1, **cursor pagination**, and **validation rules** for depth/complexity.
- Explain when you’d add **cache hints/APQ** and how you handle **errors** with `GraphQLError` codes.
- Note that **subscriptions** need `graphql-ws` (or use Socket.IO for realtime).

------

Want me to continue with **trpc-notes.md** next?