Heck yes—let’s kit you out with a crisp PHP set. I’ll keep answers tight but meaty, tuned for PHP ≥8.2, with gotchas you can bring up in follow-ups. After the 20 Q&A, you’ll get 4 coding challenges with PHPUnit-style tests and reference solutions.

# 20 PHP Interview Q&A (Senior-leaning)

1. What changed with PHP’s type system in 8.x (union, intersection, DNF, readonly)?

* Union types (8.0), intersection types (8.1), `true`/`false`/`null` as standalone types, `mixed`, `never`, `static`, `nullsafe` operator, `readonly` properties and `readonly` classes (8.2), DNF types for generics-like constraints on closures (via docblocks) still not native. Typed properties stabilize invariants; `readonly` enforces write-once after construction.

2. How do enums differ from class constants or SplEnum?

* Native `enum` (8.1) provides nominal types, backed or pure, with exhaustive `match` support, methods, and interfaces. Unlike constants, they’re type-checked at compile time and impossible to misuse as plain scalars when you want strong domain values.

3. Explain `match` vs `switch`.

* `match` is an expression, strict comparison (`===`), non-fallthrough, must be exhaustive unless a default is provided, and returns a value. `switch` is statement-based, loose by default, fallthrough unless `break`.

4. What are attributes and how would you use them?

* Native metadata on classes/methods/params. Replaces many PHPDoc use-cases (routing, validation). Reflect with `ReflectionAttribute`. Safer than parsing comments and can be cached.

5. Fibers vs Generators vs async libraries

* Generators (`yield`) build lazy iterators and coroutines. Fibers (8.1) enable cooperative concurrency—pause/resume execution stacks—used under the hood by libraries like Amp/Swoole for async I/O without callback spaghetti.

6. OPcache & JIT—when do they help?

* OPcache caches compiled opcodes: huge win for all prod apps. JIT can speed numeric/CPU-heavy loops; for typical web I/O workloads, gains are modest. Always enable OPcache; benchmark JIT per workload.

7. PSR highlights you actually use

* PSR-1/12 (coding style), PSR-3 (LoggerInterface), PSR-4 (autoloading), PSR-6/16 (caching), PSR-7/15/17 (HTTP messages/middleware/factory). Being PSR-friendly unlocks interchangeability and testability.

8. Dependency Injection in PHP: container or manual?

* Manual DI (constructor injection) is simplest and most testable. Containers help with wiring complexity, lazy services, and scopes, but keep frameworks from leaking into domain code—depend on interfaces, not the container.

9. Error handling best practices in 8.x

* Use exceptions not error codes; convert errors to exceptions with `set_error_handler` in bootstrap if needed. Catch narrowly. Use a global handler to turn fatal errors into structured logs and 5xx responses.

10. PDO prepared statements vs query building

* Always use prepared statements for untrusted input to prevent SQL injection. For complex queries, use parameterized query builders or ORMs. Beware emulated prepares in MySQL—disable if you need strict typing/limit edge cases.

11. Transactions and isolation

* Wrap multi-statement writes in `BEGIN … COMMIT` (roll back on exception). Choose isolation level per operation (e.g., `READ COMMITTED` standard; `SERIALIZABLE` for strict invariants). Idempotency & retries to handle deadlocks.

12. DateTimeImmutable vs DateTime

* Prefer `DateTimeImmutable` to avoid spooky action at a distance in shared objects. Always set a timezone (UTC in storage), format at the edges.

13. SPL & iterators you should know

* `ArrayObject`, `SplPriorityQueue`, `SplHeap`, `SplDoublyLinkedList`, `RegexIterator`, `CallbackFilterIterator`. Compose iterators to write streaming transforms without giant arrays.

14. Streams & large files

* Stream filters, `php://temp`, `fopen` with chunked reads. Avoid `file_get_contents` for huge files. For HTTP, prefer `curl`/Guzzle with streams to keep memory flat.

15. Serialization & JSON pitfalls

* `json_encode` defaults to lossy for big ints—use `JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE` and `JSON_PRESERVE_ZERO_FRACTION`. For security, avoid unserializing untrusted data (object injection).

16. Security basics you’ll be asked about

* Hash passwords with `password_hash`/`password_verify` (bcrypt/argon2). CSRF tokens on unsafe methods. Output encoding for XSS (HTML/JS/URL contexts differ). Strict session cookies; rotate IDs after login.

17. Testing stack & doubles

* PHPUnit or Pest. Unit tests: pure domain with constructor DI and mocks/stubs for ports. Integration: real DB (transaction-wrapped, rolled back) and HTTP. Use data providers; prefer small, fast suites.

18. Caching tiers & invalidation

* Local in-process (static/LRU) for hot code paths; distributed (Redis/PSR-6) for cross-node. Cache bust on writes (keys by resource version), or use TTL + background refresh. Beware stampedes: use locks or `cache->remember()` with jitter.

19. Middleware pattern (PSR-15)

* Chain of callables that receive a request and produce a response, enabling cross-cutting concerns (auth, logging, rate limits). Keep side effects order-aware (e.g., tracing before caching).

20. Deploy/ops knobs that actually matter

* PHP-FPM: process manager `pm`, `pm.max_children`, `pm.max_requests` to avoid memory bloat. Monitor slow logs. Set realpath cache, OPcache memory, and preloading for frameworks. Health endpoints and structured logs.

---

# 4 Coding Challenges (with tests & solutions)

## Challenge 1 — LRU Cache (PSR-16-ish behavior)

**Spec**

* Class `LruCache` with capacity `N`.
* `get(string $key): mixed|null`
* `set(string $key, mixed $value): void`
* Evict least-recently-used on overflow.
* O(1) `get`/`set`.

### PHPUnit-style tests

```php
// tests/LruCacheTest.php
use PHPUnit\Framework\TestCase;

final class LruCacheTest extends TestCase
{
    public function test_basic_set_get(): void
    {
        $c = new LruCache(2);
        $c->set('a', 1);
        $c->set('b', 2);
        $this->assertSame(1, $c->get('a'));
        $this->assertSame(2, $c->get('b'));
    }

    public function test_eviction_lru(): void
    {
        $c = new LruCache(2);
        $c->set('a', 1);
        $c->set('b', 2);
        $c->get('a');           // 'a' becomes MRU
        $c->set('c', 3);        // evict 'b'
        $this->assertNull($c->get('b'));
        $this->assertSame(1, $c->get('a'));
        $this->assertSame(3, $c->get('c'));
    }

    public function test_update_moves_to_mru(): void
    {
        $c = new LruCache(2);
        $c->set('a', 1);
        $c->set('b', 2);
        $c->set('a', 9);        // update & move to MRU
        $c->set('c', 3);        // evict 'b'
        $this->assertNull($c->get('b'));
        $this->assertSame(9, $c->get('a'));
        $this->assertSame(3, $c->get('c'));
    }
}
```

### Reference implementation

```php
<?php
// src/LruCache.php
final class LruCache
{
    private int $cap;
    /** @var array<string, array{prev:?string,next:?string,val:mixed}> */
    private array $map = [];
    private ?string $head = null; // MRU
    private ?string $tail = null; // LRU

    public function __construct(int $capacity)
    {
        if ($capacity < 1) throw new InvalidArgumentException('capacity >= 1');
        $this->cap = $capacity;
    }

    public function get(string $key): mixed
    {
        if (!isset($this->map[$key])) return null;
        $this->moveToHead($key);
        return $this->map[$key]['val'];
    }

    public function set(string $key, mixed $value): void
    {
        if (isset($this->map[$key])) {
            $this->map[$key]['val'] = $value;
            $this->moveToHead($key);
            return;
        }
        $this->map[$key] = ['prev'=>null,'next'=>$this->head,'val'=>$value];
        if ($this->head !== null) $this->map[$this->head]['prev'] = $key;
        $this->head ??= $key;
        $this->tail ??= $key;
        if (count($this->map) > $this->cap) $this->evictTail();
    }

    private function moveToHead(string $key): void
    {
        if ($this->head === $key) return;
        $n = $this->map[$key];
        if ($n['prev'] !== null) $this->map[$n['prev']]['next'] = $n['next'];
        if ($n['next'] !== null) $this->map[$n['next']]['prev'] = $n['prev'];
        if ($this->tail === $key) $this->tail = $n['prev'];

        $this->map[$key]['prev'] = null;
        $this->map[$key]['next'] = $this->head;
        if ($this->head !== null) $this->map[$this->head]['prev'] = $key;
        $this->head = $key;
        if ($this->tail === null) $this->tail = $key;
    }

    private function evictTail(): void
    {
        if ($this->tail === null) return;
        $evict = $this->tail;
        $prev = $this->map[$evict]['prev'];
        if ($prev !== null) $this->map[$prev]['next'] = null;
        $this->tail = $prev;
        if ($this->head === $evict) $this->head = null;
        unset($this->map[$evict]);
    }
}
```

---

## Challenge 2 — Middleware Pipeline (PSR-15-like)

**Spec**

* Build `MiddlewareInterface { public function process(Request $req, Handler $handler): Response; }`
* `Handler` calls the next middleware or final controller.
* Support any number of middlewares; order matters.

### Tests

```php
// tests/MiddlewarePipelineTest.php
use PHPUnit\Framework\TestCase;

final class MiddlewarePipelineTest extends TestCase
{
    public function test_pipeline_order_and_short_circuit(): void
    {
        $log = [];
        $mw1 = new class($log) implements MiddlewareInterface {
            public array &$log;
            public function __construct(&$log) { $this->log = &$log; }
            public function process(Request $req, Handler $handler): Response {
                $this->log[] = 'mw1:in';
                $res = $handler->handle($req);
                $this->log[] = 'mw1:out';
                return $res;
            }
        };
        $mw2 = new class($log) implements MiddlewareInterface {
            public array &$log;
            public function __construct(&$log) { $this->log = &$log; }
            public function process(Request $req, Handler $handler): Response {
                $this->log[] = 'mw2:short';
                return new Response(401, 'nope');
            }
        };
        $pipeline = new Pipeline([$mw1, $mw2], fn(Request $r) => new Response(200, 'ok'));
        $res = $pipeline->handle(new Request('/'));
        $this->assertSame(401, $res->status);
        $this->assertSame(['mw1:in','mw2:short','mw1:out'], $log);
    }
}
```

### Reference implementation

```php
<?php
// src/Http.php
final class Request { public function __construct(public string $path) {} }
final class Response { public function __construct(public int $status, public string $body) {} }

interface MiddlewareInterface
{
    public function process(Request $req, Handler $handler): Response;
}

final class Handler
{
    /** @var list<MiddlewareInterface> */
    private array $stack;
    /** @var callable(Request):Response */
    private $final;

    public function __construct(array $stack, callable $final)
    {
        $this->stack = array_values($stack);
        $this->final = $final;
    }

    public function handle(Request $req): Response
    {
        if (!$this->stack) {
            $final = $this->final;
            return $final($req);
        }
        $mw = array_shift($this->stack);
        return $mw->process($req, $this);
    }
}

final class Pipeline extends Handler {}
```

---

## Challenge 3 — Concurrent HTTP GET (curl_multi) with Timeout & Retry

**Spec**

* Function `multi_get(array $urls, int $timeoutMs = 2000, int $retries = 1): array`
* Returns `url => ['status' => int|null, 'body' => string|null, 'error' => string|null]`
* Curl multi, per-request timeout, simple exponential backoff.

### Tests

```php
// tests/MultiGetTest.php
use PHPUnit\Framework\TestCase;

final class MultiGetTest extends TestCase
{
    public function test_basic_shapes(): void
    {
        $urls = ['https://example.com', 'https://iana.org'];
        $res = multi_get($urls, 3000, 0);
        $this->assertSame(array_keys($res), $urls);
        foreach ($res as $r) {
            $this->assertArrayHasKey('status', $r);
            $this->assertArrayHasKey('body', $r);
            $this->assertArrayHasKey('error', $r);
        }
    }
}
```

### Reference implementation

```php
<?php
// src/multi_get.php
function multi_get(array $urls, int $timeoutMs = 2000, int $retries = 1): array
{
    $results = [];
    $attempt = 0;
    do {
        $pending = array_diff($urls, array_keys($results));
        if (!$pending) break;

        $mh = curl_multi_init();
        $chs = [];
        foreach ($pending as $u) {
            $ch = curl_init($u);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT_MS => $timeoutMs,
                CURLOPT_TIMEOUT_MS => $timeoutMs,
                CURLOPT_USERAGENT => 'multi_get/1.0',
            ]);
            $chs[$u] = $ch;
            curl_multi_add_handle($mh, $ch);
        }

        do {
            $status = curl_multi_exec($mh, $running);
            if ($running) curl_multi_select($mh, 0.1);
        } while ($running && $status == CURLM_OK);

        foreach ($chs as $u => $ch) {
            $err = curl_error($ch);
            $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE) ?: null;
            $body = $err ? null : curl_multi_getcontent($ch);
            if ($err || $code >= 500 || $code === 0) {
                // defer result; maybe retry
            } else {
                $results[$u] = ['status'=>$code, 'body'=>$body, 'error'=>null];
            }
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
        }
        curl_multi_close($mh);

        if (count($results) < count($urls) && $attempt < $retries) {
            usleep((int)(100000 * (2 ** $attempt))); // 100ms, 200ms, ...
        }
        $attempt++;
    } while ($attempt <= $retries);

    // fill failures
    foreach ($urls as $u) {
        if (!isset($results[$u])) {
            $results[$u] = ['status'=>null,'body'=>null,'error'=>'timeout_or_server_error'];
        }
    }
    return $results;
}
```

---

## Challenge 4 — Functional `flatten()` via Generators (no recursion blow-ups)

**Spec**

* `flatten(iterable $data): \Generator` that yields scalars in order, depth-first.
* Treat `Traversable` and arrays as containers; everything else is yielded as is.

### Tests

```php
// tests/FlattenTest.php
use PHPUnit\Framework\TestCase;

final class FlattenTest extends TestCase
{
    public function test_flattens_mixed(): void
    {
        $input = [1, [2, 3, [4]], new ArrayIterator([5, [6]])];
        $out = iterator_to_array(flatten($input));
        $this->assertSame([1,2,3,4,5,6], $out);
    }

    public function test_handles_scalars_and_objects(): void
    {
        $o = (object)['x'=>1];
        $out = iterator_to_array(flatten([$o, 2]));
        $this->assertSame([$o, 2], $out);
    }
}
```

### Reference implementation

```php
<?php
// src/flatten.php
function flatten(iterable $data): \Generator
{
    $stack = [ $data ];
    while ($stack) {
        $cur = array_pop($stack);
        foreach ($cur as $v) {
            if (is_array($v) || $v instanceof Traversable) {
                // push to stack to avoid deep recursion
                $stack[] = $v;
            } else {
                yield $v;
            }
        }
    }
    // Note: This yields in reverse depth-chunk order; if you want strict left-to-right, use a queue:
    // Replace array_pop with array_shift and push with array_push (or SplQueue).
}
```

---

## Bonus: quick PHPUnit bootstrap (composer)

```json
// composer.json (snippet)
{
  "require-dev": { "phpunit/phpunit": "^11.0" },
  "autoload": { "psr-4": { "App\\": "src/" }, "files": ["src/multi_get.php","src/flatten.php"] },
  "autoload-dev": { "psr-4": { "Tests\\": "tests/" } },
  "scripts": { "test": "phpunit --colors=always" }
}
```

---

Want me to tailor more Q&A for Laravel/Symfony, or swap one challenge for DB transactions with retries (deadlock-safe) or a tiny attribute-driven validator?


---

# Hack

Since you’re interviewing at Meta, the flavor of PHP is actually a little unusual: Meta doesn’t run vanilla PHP 8.x in production—they use **HHVM** (HipHop Virtual Machine) and their own dialect called **Hack**. So you’re not going to get grilled on “what changed in PHP 8.2 vs 8.1” trivia.

Instead, they’ll test your **core engineering chops** in a PHP-ish syntax, with emphasis on:

* **Strong problem-solving** (algorithms, data structures, correctness, efficiency).
* **System design** (service boundaries, scaling, caching, fault tolerance).
* **Clean, testable code** (OOP design, typing, immutability, DI patterns).
* **API ergonomics** (especially GraphQL schema/resolver design).
* **Practical safety/security** (memory use, null handling, type safety, SQL injection, etc.).

That said, interviewers sometimes use version-specific questions as proxies for “do you keep up with the ecosystem” or “do you understand modern best practices.”
So you probably won’t get a direct “what did 8.1 add?” but you could absolutely be asked:

* Why you’d prefer **`DateTimeImmutable`** over `DateTime`.
* Why **`password_hash`** is better than writing your own hashing.
* What **OPcache** does and how you’d deploy with it.
* How **strict typing** improves codebases (and how you’d migrate old PHP 5/7 code).

In short:

* **Meta’s bar:** correctness, clarity, scaling, code quality.
* **Version knowledge:** useful garnish, not the entrée. If you demonstrate you can solve problems cleanly with modern constructs (typed properties, exceptions, immutable patterns, DI), you’ll be in good shape.

If you’ve been away since PHP 3 and are brushing up, the safest prep is:

1. **Work in strict mode**: `declare(strict_types=1);` at the top of every file.
2. **Use type hints everywhere** (params, return, properties).
3. **Lean on immutability and small classes/functions.**
4. **Write PHPUnit/Pest tests as you go.**

Would you like me to put together a **Meta-style mock interview in PHP**, with one data structure/algorithm problem, one GraphQL schema design prompt, and one “debug/fix this broken code” challenge? That’d give you the flavor of what you’re likely to face.
