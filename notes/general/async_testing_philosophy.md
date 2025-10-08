You’ve got two targets here: (1) *how to think* about testing async systems and doubles, and (2) *how to do it* for GraphQL resolvers. I’ll keep it interview-friendly with small, crisp examples in **JavaScript (Jest)** and **PHP (PHPUnit + graphql-php / ReactPHP/Amp)**.

---

# Testing philosophy (in 90 seconds)

**Test doubles (what & when):**

* **Dummy:** placeholder to satisfy a signature (never used).
* **Stub:** returns canned data (controls code path); *no* behavior assertions.
* **Spy:** records calls/args for later assertions; often a wrapped stub.
* **Mock:** a spy with *expectations* (behavior verified).
* **Fake:** lightweight alternative impl (e.g., in-mem repo, in-proc SMTP).

**Why doubles?**
To isolate the unit, control nondeterminism (time, I/O, randomness), and turn slow/flaky integration concerns into fast, reliable tests.

**Async testing principles:**

* Make time **injectable** (fake timers/clock) instead of `sleep()`.
* Make I/O **boundary-based** (interfaces) so you can stub/mocks at edges.
* Prefer **deterministic signaling** (promises, channels) to wall-clock waits.
* Assert **outcomes and interactions**, not timing (“was retried with backoff”, “batch size ≤ N”, etc.).

---

# JavaScript: async tests (Jest)

### 1) Promises/async-await (no `done`)

```js
test('fetchUser resolves JSON', async () => {
  const http = { get: jest.fn().mockResolvedValue({ data: { id: 1 } }) };
  const user = await fetchUser(http, 1); // your function depends on `http`
  expect(http.get).toHaveBeenCalledWith('/users/1');
  expect(user).toEqual({ id: 1 });
});
```

### 2) Retries/backoff with fake timers

```js
jest.useFakeTimers();

test('retries with exp backoff up to 3 times', async () => {
  const http = { get: jest.fn()
    .mockRejectedValueOnce(new Error('503'))
    .mockRejectedValueOnce(new Error('503'))
    .mockResolvedValue({ data: { ok: true } })
  };

  const p = fetchWithRetry(http, '/x'); // starts async
  // advance timers through 2 backoffs
  await jest.runAllTimersAsync();
  await expect(p).resolves.toEqual({ ok: true });

  expect(http.get).toHaveBeenCalledTimes(3);
});
```

### 3) Races / cancellation

Design for a cancellable token and assert the fast-path wins:

```js
test('first response wins the race', async () => {
  const slow = () => new Promise(r => setTimeout(() => r('slow'), 50));
  const fast = () => Promise.resolve('fast');

  const winner = await raceFirst([slow, fast]);
  expect(winner).toBe('fast');
});
```

---

# PHP: async-ish and doubles

PHP isn’t natively async, but you’ll see **ReactPHP** or **Amp**. Even without them, the *testing approach* is the same: inject boundaries (HTTP client, clock) and stub/mocks.

### 1) PHPUnit with a stubbed repository

```php
interface UserRepo { public function find(int $id): array; }

final class GetUser {
    public function __construct(private UserRepo $repo) {}
    public function __invoke(int $id): array { return $this->repo->find($id); }
}

public function test_get_user_happy_path(): void {
    $repo = $this->createStub(UserRepo::class);
    $repo->method('find')->willReturn(['id' => 1]);
    $uc = new GetUser($repo);

    $out = $uc(1);

    $this->assertSame(['id' => 1], $out);
}
```

### 2) ReactPHP/Amp promises (await deterministically)

```php
use React\Promise\Deferred;
use function React\Promise\resolve;

public function test_async_resolves(): void {
    $deferred = new Deferred();
    $promise = myAsyncThing($deferred->promise()); // your fn
    $deferred->resolve('ok');

    $result = React\Async\await($promise); // or Clue\React\Block\await

    $this->assertSame('ok', $result);
}
```

### 3) Fake clock instead of sleep

Create a Clock interface (`now()`, `sleep(ms)`), pass a **FakeClock** in tests that increments instantly and triggers scheduled tasks synchronously—no flakiness.

---

# GraphQL: how to test resolvers

## What to test

1. **Unit (resolver only):** call `(parent, args, ctx, info)` directly; stub data sources and auth.
2. **Integration (schema execution):** execute a real GraphQL operation against the schema with mocked data sources; assert shape, `errors`, nullability, and selection behavior.
3. **Behavioral edges:** authZ, N+1 avoidance (DataLoader batching), pagination, error propagation (null bubbles), and performance envelopes.

## JS (Apollo style) — unit testing a resolver

```js
// resolver.js
export const resolvers = {
  Query: {
    playlist: (_, { id }, { repos }) => repos.playlists.get(id),
  },
};

// resolver.test.js
test('playlist queries repo with id', async () => {
  const repos = { playlists: { get: jest.fn().mockResolvedValue({ id: 'p1' }) } };
  const result = await resolvers.Query.playlist(null, { id: 'p1' }, { repos }, null);
  expect(repos.playlists.get).toHaveBeenCalledWith('p1');
  expect(result).toEqual({ id: 'p1' });
});
```

## JS — integration against a schema

```js
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';

const typeDefs = /* GraphQL */`
  type Playlist { id: ID!, name: String! }
  type Query { playlist(id: ID!): Playlist }
`;
const resolvers = {
  Query: { playlist: (_, { id }, { repos }) => repos.playlists.get(id) }
};

test('executes query and returns data with no errors', async () => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const ctx = { repos: { playlists: { get: jest.fn().mockResolvedValue({ id:'1', name:'Chill' }) } } };
  const query = `query($id:ID!){ playlist(id:$id){ id name } }`;

  const res = await graphql({ schema, source: query, variableValues: { id:'1' }, contextValue: ctx });

  expect(res.errors).toBeUndefined();
  expect(res.data).toEqual({ playlist: { id:'1', name:'Chill' } });
});
```

## JS — batching/N+1 with DataLoader

```js
test('batch loader coalesces keys', async () => {
  const batch = jest.fn(async (ids) => ids.map(id => ({ id })));
  const loader = new DataLoader(batch);

  await Promise.all([loader.load('a'), loader.load('b')]);
  expect(batch).toHaveBeenCalledTimes(1);
  expect(batch).toHaveBeenCalledWith(['a','b']);
});
```

## PHP (webonyx/graphql-php) — unit testing a resolver

```php
use GraphQL\GraphQL;
use GraphQL\Type\Schema;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;

public function test_playlist_resolver(): void {
    $playlistType = new ObjectType([
        'name' => 'Playlist',
        'fields' => ['id' => Type::nonNull(Type::id()), 'name' => Type::nonNull(Type::string())]
    ]);

    $queryType = new ObjectType([
        'name' => 'Query',
        'fields' => [
            'playlist' => [
                'type' => $playlistType,
                'args' => ['id' => Type::nonNull(Type::id())],
                'resolve' => function($root, $args, $ctx) {
                    return $ctx['repos']['playlists']->get($args['id']);
                }
            ]
        ]
    ]);

    $schema = new Schema(['query' => $queryType]);
    $repo = $this->createMock(PlaylistRepo::class);
    $repo->method('get')->with('1')->willReturn(['id' => '1', 'name' => 'Chill']);
    $ctx = ['repos' => ['playlists' => $repo]];

    $query = 'query($id:ID!){ playlist(id:$id){ id name } }';
    $result = GraphQL::executeQuery($schema, $query, null, $ctx, ['id' => '1'])->toArray();

    $this->assertArrayNotHasKey('errors', $result);
    $this->assertSame(['playlist' => ['id'=>'1','name'=>'Chill']], $result['data']);
}
```

---

# What interviewers probe (and how to answer cleanly)

* **Auth in resolvers:** “I check `ctx.user` (or capability) at the *top* of the resolver, fail fast with a typed error, and return `null` for fields where the schema requires it to bubble properly.”
* **N+1 avoidance:** “I wrap data access in DataLoaders keyed by relation, asserted with a batching test (one call per tick).”
* **Pagination correctness:** “Unit test edges: `first=0`, `after` cursor invalid, end-of-list. Integration test that `pageInfo.hasNextPage` aligns with returned edges.”
* **Error propagation:** “I assert the `errors[0].path` matches the field, and the parent remains non-null unless the schema forces a null bubble to root.”
* **Flakiness control:** “I inject a clock and use fake timers. I never assert absolute durations; I assert *effects after advancing* the virtual clock.”

---

# A short checklist you can reuse

* **Unit**: Resolver called with `(parent,args,ctx,info)` & stubs for all I/O.
* **Auth**: both allowed/denied paths.
* **DataLoader**: batching verified (call count), caching verified (same key hit once).
* **Pagination**: boundary args + invariants (`edges.length ≤ first`, cursors monotonic).
* **Errors**: typed, `path` asserted, nullability rules respected.
* **Async**: fake timers/clock; no sleeps; retry/backoff observed; idempotency where relevant.
* **Performance guard** (optional): “large” fixture under a time/iteration budget with a profiler counter (not wall-clock).

If you want, I can turn this into a tiny boilerplate repo layout (Jest + graphql-tools; PHPUnit + graphql-php) with ready-to-run examples and a couple of failing tests you fix to learn the ropes next.
