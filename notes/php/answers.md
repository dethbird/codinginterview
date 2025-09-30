# 1. What changed with PHP’s type system in 8.x (union, intersection, DNF, readonly)?

Perfect — this is one of those questions that sounds like an encyclopedia dump but you can turn it into a *story of PHP growing up*. Let’s break it down into crisp interview ammo:

---

## PHP 8.x Type System Evolution

### 1. **Union Types (8.0)**

* Syntax: `function foo(int|string $x): void {}`
* Means the param can be *either* type.
* Safer than phpdoc `@param int|string` because the engine enforces it at runtime.
* Common uses: `int|float` (numeric), `string|Stringable` (accept raw string or object with `__toString`).

### 2. **`mixed`, `static`, `false`, `null` (8.0–8.1)**

* `mixed`: “anything” (like top type). Useful for migration boundaries.
* `static`: “late static binding” return type → method returns the same class type as it’s called on.
* `false`: can be used as a return type by itself or in a union (`string|false`) to reflect old APIs.
* `null` as standalone type for explicit `null` returns.

### 3. **Intersection Types (8.1)**

* Syntax: `function foo(A&B $obj): void {}`
* Means the argument must implement *both* interfaces (or extend both contracts).
* Useful for traits of behavior (e.g., `Countable&Iterator`).
* Cannot be combined with union directly (at least not yet).

### 4. **Disjunctive Normal Form (DNF) Types (8.2)**

* Syntax: `(A&B)|C`
* Before 8.2, you couldn’t combine union and intersection in one declaration.
* Now you can: require either “an object that’s both `ArrayAccess & Countable` OR just a `Traversable`”.
* This makes complex generics-like constraints possible without hacky docblocks.

### 5. **`readonly` Properties & Classes (8.1, 8.2)**

* **Readonly property (8.1)**:

  ```php
  class User {
      public readonly string $id;
      public function __construct(string $id) { $this->id = $id; }
  }
  $u = new User('123');
  $u->id = '456'; // Error
  ```
* **Readonly classes (8.2)**:

  ```php
  readonly class Point {
      public function __construct(public int $x, public int $y) {}
  }
  ```

  Every property is readonly; no mutation allowed after construction.
* This enforces immutability at the language level, which plays beautifully with DTOs, value objects, and functional-style domain modeling.

---

## How to talk about it in an interview

> “PHP 8.x really strengthened its type system. We gained *union types* in 8.0, which turned common phpdoc hints into enforced contracts. 8.1 added *intersection types* and *readonly properties* for immutability. 8.2 brought *DNF types*—so now we can mix unions and intersections in one declaration—and *readonly classes* for true immutable value objects. Together these changes push PHP closer to a strongly typed language, and they make code safer, more expressive, and easier to refactor.”

---

Would you like me to also map these directly to **Hack language equivalents** (since Meta uses Hack/HHVM), so you can sound fluent if an interviewer switches gears?

# Hack

Absolutely—here’s a side-by-side “PHP 8.x ⇄ Hack (HHVM)” cheat sheet so you can code-switch mid-interview without breaking stride.

# PHP 8.x ↔ Hack type-system mapping

### Union types

* **PHP:** `int|string`
* **Hack:** `int | string` (same idea)

```php
// PHP
function f(int|string $x): void {}

// Hack
function f(int | string $x): void {}
```

### Intersection types

* **PHP:** `A&B`
* **Hack:** `A & B` (same idea; commonly used with interfaces/traits of behavior)

```php
// PHP
function g(Countable&Iterator $x): void {}

// Hack
function g(Countable & Iterator $x): void {}
```

### DNF (mix union & intersection)

* **PHP:** `(A&B)|C`
* **Hack:** `(A & B) | C` (Hack’s type grammar has supported this style for years)

```php
// PHP
function h((ArrayAccess&Countable)|Traversable $t): void {}

// Hack
function h((ArrayAccess & Countable) | Traversable $t): void {}
```

### Nullable

* **PHP:** `?T`
* **Hack:** `?T` (identical)

```php
// both
function maybe(?string $s): void {}
```

### `mixed`

* **PHP:** `mixed` (top type)
* **Hack:** `mixed` (top type), **plus** `dynamic` (gradual typing for unknown structure at runtime)

```hack
function uses_mixed(mixed $x): void {}
function uses_dynamic(dynamic $x): void {} // accepts anything, with looser member access rules
```

### `static` / late-static return

* **PHP:** `static` return type (8.0+)
* **Hack:** `this` return type (covariant, late-static flavor). Hack also supports `static` in some contexts, but idiomatic late-static returns use `this`.

```php
// PHP
class C { public function cloneSelf(): static { /* ... */ } }

// Hack
class C { public function cloneSelf(): this { /* ... */ } }
```

### Literal types (`true`, `false`) and `never`

* **PHP:** `true`, `false`, `never`
* **Hack:** `true`, `false`, `noreturn`

```php
// PHP
function fail(): never { throw new Exception('x'); }

// Hack
function fail(): noreturn { throw new \Exception('x'); }
```

### Readonly / immutability

* **PHP:** `readonly` properties (8.1), `readonly` classes (8.2) — write-once after construction.
* **Hack:** multiple tools:

  * `<<__Const>>` on **properties** → immutable after construction.
  * `readonly` for **collections**/views (e.g., `\HH\Readonly\Vec`), and **readonly** experimental keyword for properties is available in modern Hack.
  * `sealed`/`final` + value-object patterns used frequently.

```php
// PHP
readonly class Point { public function __construct(public int $x, public int $y) {} }

// Hack
final class Point {
  <<__Const>> public int $x;
  <<__Const>> public int $y;
  public function __construct(int $x, int $y) { $this->x = $x; $this->y = $y; }
}
```

### Enums

* **PHP:** native `enum` (8.1) with backed/pure enums.
* **Hack:** **enum**s are long-standing and richer: first-class enums, enum classes, constraints, `arraykey`-backed, powerful patterning.

```php
// PHP
enum Role: string { case Admin = 'admin'; case User = 'user'; }

// Hack
enum Role: string { Admin = 'admin'; User = 'user'; }
```

### Generics

* **PHP:** no first-class generics; rely on templates via phpdoc + static analyzers.
* **Hack:** **true generics** for classes, methods, functions; constraints (`T as SomeInterface`), reified generics in many contexts.

```hack
final class Box<T> { public function __construct(private T $x) {} public function get(): T { return $this->x; } }
```

### Shapes (typed array-like structs)

* **PHP:** no native shapes (use DTOs or array-shape annotations).
* **Hack:** **shapes** are first-class: structural records with required/optional fields, type-checked.

```hack
type UserShape = shape('id' => int, 'name' => string, ?'email' => string);
function take(UserShape $u): void {}
```

### Soft types / gradual typing

* **PHP:** none
* **Hack:** `<<__Soft>>` on parameters/returns says “enforce at analysis, but be lenient at runtime”; plus `dynamic` type for gradual migration.

### `is`/`as` checks, refinement

* **PHP:** `instanceof`, manual guards.
* **Hack:** `is`/`as` operators + pattern-like refinement works well with `?T`, unions, and shapes.

---

## Practical interview notes

* If they switch to Hack terminology, translate on the fly:

  * PHP `static` return → Hack `this`.
  * PHP `never` → Hack `noreturn`.
  * PHP “array of stuff” → Hack `vec<T>` / `dict<tk, tv>` / `keyset<T>`.
  * PHP docblock generics → Hack’s real generics with constraints.
  * PHP array-shapes in phpdoc → Hack **shapes** (compile-time checked).
  * PHP `readonly` class → Hack `<<__Const>>` properties + value-object style; mention readonly collections.

* If they probe **GraphQL + Hack**, it’s common to see:

  * Strongly typed **DTOs** with generics.
  * DataLoader patterns with typed signatures.
  * Shapes for small response building, then mapping to DTOs.

* Name-drop safely:

  * “Hack’s `vec/dict/keyset` eliminate PHP’s ambiguous array semantics.”
  * “We lean on `enum` + `this` return types for fluent builders and safe APIs.”
  * “Shapes are great at the edges, DTOs in the core; `<<__Const>>` keeps value objects immutable.”

If you want, I can take one of your PHP snippets and show the **straight translation into Hack** (with generics/shapes/readonly), so you can practice answering follow-ups with code you already know.

# How do enums differ from class constants or SplEnum?

This is one of those “show you know the *why* not just the *what*” questions. Let’s unpack it in layers.

---

## Class constants & SplEnum (before 8.1)

* **Class constants**

  ```php
  class Status {
      public const DRAFT = 'draft';
      public const PUBLISHED = 'published';
  }
  ```

  *Pros*: simple, supported everywhere.
  *Cons*: not type-safe — you can pass any string, not just the defined ones. No exhaustive checking; you can’t `switch` and have PHP warn you if you missed a case.

* **SplEnum (PECL, not core)**

  ```php
  class Status extends SplEnum {
      const __default = self::DRAFT;
      const DRAFT = 'draft';
      const PUBLISHED = 'published';
  }
  ```

  *Pros*: closer to real enums, has default, runtime enforcement.
  *Cons*: PECL extension (not always installed), runtime-only checks (no compile-time), awkward API.

---

## Native Enums (PHP 8.1+)

* **Pure enums**: set of named values, no backing scalar.

  ```php
  enum Status {
      case Draft;
      case Published;
  }
  ```

* **Backed enums**: each case has a scalar (string/int).

  ```php
  enum Status: string {
      case Draft = 'draft';
      case Published = 'published';
  }
  ```

* **Methods & interfaces**
  Enums can define methods, implement interfaces, and use traits. Cases are actual objects.

* **Strict type checking**
  Function signatures can demand `Status` — you can’t pass random strings.

  ```php
  function publish(Status $s): void { ... }
  publish(Status::Draft); // ✅
  publish('draft');       // ❌ TypeError
  ```

* **Exhaustiveness with `match`**

  ```php
  $msg = match($s) {
      Status::Draft => 'Still working',
      Status::Published => 'Done',
  };
  ```

  If you forget a case, PHP throws `UnhandledMatchError`.

---

## Interview-level differences

1. **Type safety**
   Enums are first-class types. Class constants are just untyped scalars. SplEnum enforces at runtime but isn’t part of the language core.

2. **Exhaustiveness**
   `match` + enums = compiler/runtime enforcement that you handled all cases.

3. **Expressiveness**
   Enums can carry methods, implement interfaces, hold scalar values (backed enums). Class constants are inert.

4. **Interop**
   Backed enums serialize to scalars (string/int) cleanly for DB/API use. Class constants need manual mapping.

5. **Maintainability**
   If you add a new enum case, `match` will force you to handle it. Add a new class constant and old switches silently ignore it.

---

## Short, confident interview phrasing

> “Class constants are just scalars — no type safety. SplEnum was a PECL extension that faked enums at runtime. Native enums are first-class: type-checked, can be backed by scalars, can define methods, and integrate with `match` for exhaustiveness. They give you domain modeling power, not just named constants.”

---

Want me to also show how this maps onto **Hack enums** (which are older and richer), so you can connect dots if the interviewer pivots?

# Explain `match` vs `switch`.

Here’s where you can shine by showing you know both syntax and *semantics*.

---

## `switch` (old-school)

* Statement, not an expression. Doesn’t return a value.
* **Loose comparison (`==`)** by default — can surprise you.
* **Fall-through** unless you `break`.
* No enforcement that all cases are covered.
* Example:

  ```php
  $x = '2';
  switch ($x) {
      case 2: echo "loose match"; break;   // runs!
      case '2': echo "string"; break;
      default: echo "other";
  }
  ```

---

## `match` (new in PHP 8.0)

* **Expression** → returns a value.
* **Strict comparison (`===`)**.
* **No fall-through** → one branch only.
* **Exhaustive**: you must handle every possible input (either via `default` or every case).
* Cleaner syntax, especially when binding a result.
* Example:

  ```php
  $x = '2';
  $y = match ($x) {
      2       => "int",
      '2'     => "string",
      default => "other",
  };
  echo $y; // "string"
  ```

---

## Key differences to highlight in an interview

1. **Expression vs. statement**: `match` returns a value, `switch` doesn’t.
2. **Comparison mode**: `match` uses `===` (no coercion), `switch` uses `==` (loose).
3. **Fallthrough**: `switch` falls through unless you `break`; `match` never falls through.
4. **Exhaustiveness**: `match` forces you to cover all possibilities; `switch` doesn’t.
5. **Readability**: `match` is concise for mapping input → output.

---

## Smart interview phrasing

> “`switch` is an old control statement that uses loose comparisons and fallthrough by default, which makes bugs easy. `match` is new in PHP 8: it’s an expression, uses strict `===` comparison, doesn’t fall through, and enforces that all cases are handled. It’s much safer for mapping values.”

---

Would you like me to also sketch **when you’d *still* use `switch`** today (since some interviewers like to see you don’t just say “always match”)?

# What are attributes and how would you use them?

This is a fun one because it’s really about PHP catching up to what Java/C# folks have had for ages.

---

## What attributes are

* **Introduced in PHP 8.0**.
* They’re structured **metadata** you can attach to classes, methods, functions, properties, parameters, even class constants.
* Written with `#[...]` syntax (not to be confused with `//` annotations or `@phpdoc` comments).
* They’re real objects, available through reflection.

Example:

```php
#[Route('/users/{id}', methods: ['GET'])]
class UserController {
    #[Inject(Logger::class)]
    public function __construct(private Logger $logger) {}

    #[Cache(ttl: 3600)]
    public function show(int $id): User { /* ... */ }
}
```

---

## Why they matter

1. **Stronger than PHPDoc**

   * Docblocks (`@Route`, `@var`) are just comments; tools parse them, but the engine ignores them.
   * Attributes are **parsed by the engine** and carried into reflection, so they’re type-safe and not lost when you strip comments.

2. **Framework-friendly**

   * Routing: `#[Route('/foo')]` instead of YAML/annotations.
   * Dependency injection: `#[Inject]` on constructor parameters.
   * Validation: `#[Assert\Email]` on a property.
   * ORM mapping: `#[Column(type: 'string', length: 255)]`.

3. **Better tooling**

   * IDEs and static analyzers can resolve attributes as real classes.
   * Autoloadable, refactorable, not magic strings in comments.

---

## How you use them in practice

* **Define an attribute class**

  ```php
  #[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS)]
  class Route {
      public function __construct(
          public string $path,
          public array $methods = ['GET']
      ) {}
  }
  ```
* **Apply it to a class/method**

  ```php
  #[Route('/users')]
  class UserController { /* ... */ }
  ```
* **Read it via reflection**

  ```php
  $rc = new ReflectionClass(UserController::class);
  foreach ($rc->getAttributes(Route::class) as $attr) {
      $route = $attr->newInstance();
      echo $route->path; // "/users"
  }
  ```

---

## Interview phrasing

> “Attributes are native metadata in PHP 8+, replacing comment-based annotations. They’re actual classes you can define and reflect on, which makes them safer and more powerful. I’d use them for things like routing, validation, DI wiring, and ORM mapping—basically wherever you want declarative metadata tied to code elements.”

---

Do you want me to also show you how **Hack (Meta’s PHP dialect)** does this? It uses **user attributes** (`<<Foo>>`) with a very similar purpose.

    > I don't get it:

Good — this is the exact “aha” point where attributes click. Let’s walk it through step by step with a concrete mini-framework vibe.

---

### 1. You define the attribute class

```php
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class Route {
    public function __construct(
        public string $path,
        public array $methods = ['GET']
    ) {}
}
```

* `#[Attribute(...)]` tells PHP this is an attribute class.
* You can restrict where it’s allowed (`TARGET_CLASS`, `TARGET_METHOD`, etc.).
* Constructor args become the metadata you pass in when you use it.

---

### 2. You tag your controller with the attribute

```php
#[Route('/users', methods: ['GET'])]
class UserController {
    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id) {
        return "show user $id";
    }
}
```

Here, `Route` isn’t *executed* automatically — it’s metadata attached to the class and method.

---

### 3. Your framework (or you) reflects on it

Imagine a tiny router that scans controllers at bootstrap:

```php
$rc = new ReflectionClass(UserController::class);

// Class-level route (e.g. base path)
foreach ($rc->getAttributes(Route::class) as $attr) {
    $route = $attr->newInstance();
    echo "Controller base: {$route->path}\n"; // "/users"
}

// Method-level routes
foreach ($rc->getMethods() as $method) {
    foreach ($method->getAttributes(Route::class) as $attr) {
        $route = $attr->newInstance();
        echo "Method {$method->getName()} => {$route->path}\n";
        // "Method show => /{id}"
    }
}
```

---

### 4. How this becomes useful

* Your **router** collects all `Route` attributes at startup → builds a routing table:
  `"/users" + "/{id}" → UserController::show`.
* When a request comes in, it looks up the path and invokes that controller method.
* The controller itself doesn’t “use” the attribute directly — the *framework* does.

---

### Analogy

Think of attributes like sticky notes on your class:

* The sticky note says “Hey, this maps to `/users`.”
* Your router engine walks around reading sticky notes and wiring everything up.
* The class itself stays clean; no need for hardcoded routing arrays or config files.

---

### Interview phrasing

> “UserController doesn’t directly consume its own `Route` attribute. Instead, the framework scans for those attributes with reflection at bootstrap and builds routing tables. So the attribute acts as declarative metadata: a clean way to say ‘this class handles `/users`’ without mixing routing logic into code or config files.”

---

Want me to show you a **15-line router that actually dispatches** based on `#[Route]` attributes, so you can *see* a request hit `UserController::show`?

# Fibers vs Generators vs async libraries
This one is juicy because it touches on PHP’s “concurrency story,” which is unusual compared to Node or Go. The interviewer wants to see if you can distinguish between these primitives and when you’d reach for them.

---

## Generators (`yield`)

* **Introduced in PHP 5.5.**
* They turn functions into *lazy iterators* without building full arrays.
* You can also use `yield` to build **coroutines**, pausing/resuming execution, but the call stack doesn’t fully suspend (it’s limited to that function).
* Typical use: streaming results, infinite sequences, pipelines.

```php
function numbers(): Generator {
    for ($i = 0; $i < 3; $i++) {
        yield $i;
    }
}
foreach (numbers() as $n) echo $n;
```

---

## Fibers

* **New in PHP 8.1.**
* Full **cooperative concurrency primitive**.
* Let you pause and resume execution of *any call stack*, not just inside a generator.
* Think: coroutines with their *own stack*, closer to green threads.
* Low-level building block — most people won’t use them directly. Instead, **async libraries build on top of them**.

```php
$fiber = new Fiber(function(): void {
    echo "start\n";
    Fiber::suspend("paused");
    echo "resume\n";
});
$value = $fiber->start();
echo $value;   // "paused"
$fiber->resume(); // "resume"
```

---

## Async libraries (Amp, ReactPHP, Swoole, etc.)

* **Amp/ReactPHP**: event-loop based async frameworks. They use Fibers (or before that, Generators + promises) to let you write async code in sync style.
* **Swoole**: a C extension that gives PHP coroutine + evented I/O directly, highly performant.
* They wrap non-blocking I/O (sockets, HTTP, DB clients) and scheduling.
* With Fibers, async libs can expose code like:

  ```php
  $html = HTTP\get('https://example.com');
  $data = DB\query('SELECT * FROM users');
  ```

  …but under the hood it’s cooperative multitasking, not blocking.

---

## Differences in one-liners

* **Generator**: yields values lazily; limited coroutine capability, no full stack suspension.
* **Fiber**: true cooperative multitasking primitive; suspend/resume any call stack.
* **Async library**: builds on Fibers (or Generators) + an event loop to make async I/O ergonomic.

---

## Interview phrasing

> “Generators are for lazy iteration and simple coroutines, but they don’t suspend the full call stack. Fibers, added in 8.1, do let you suspend and resume whole call stacks, which makes them a proper concurrency primitive. Async libraries like Amp or ReactPHP sit on top, combining Fibers with an event loop and non-blocking I/O so you can write async code in a synchronous style. Most developers use the library layer; Fibers themselves are the low-level building block.”

---

Want me to sketch a **tiny example** where you fetch two URLs concurrently with Amp (Fiber-based) vs sequentially with `file_get_contents`, so you see the practical speedup?

    > example please

Sweet—here’s a tiny, hands-on demo you can run that shows **sequential** vs **concurrent** HTTP fetches using **Amp v3 (Fiber-powered)**. It’s minimal but interview-ready.

---

## 0) Setup

```bash
mkdir amp-demo && cd amp-demo
composer init -n
composer require amphp/http-client:^5
```

---

## 1) Baseline: sequential fetch (blocking)

`sequential.php`

```php
<?php
declare(strict_types=1);

$urls = [
    'https://httpbin.org/delay/2', // sleeps ~2s
    'https://httpbin.org/delay/2',
];

$start = hrtime(true);

$results = [];
foreach ($urls as $url) {
    $results[$url] = file_get_contents($url); // sequential: ~4s total
}

$elapsed = (hrtime(true) - $start) / 1e9;
printf("Sequential total: %.3fs\n", $elapsed);
```

Run:

```bash
php sequential.php
```

Expect ~4 seconds (2s + 2s).

---

## 2) Concurrent fetch with Amp (Fibers under the hood)

`concurrent_amp.php`

```php
<?php
declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use Amp\Http\Client\HttpClientBuilder;
use Amp\Http\Client\Request;
use function Amp\async;

$urls = [
    'https://httpbin.org/delay/2',
    'https://httpbin.org/delay/2',
];

$client = HttpClientBuilder::buildDefault();

$start = hrtime(true);

// Launch both requests concurrently.
// Each async(...) runs in its own Fiber; the HTTP client uses non-blocking I/O.
$futures = [];
foreach ($urls as $url) {
    $futures[$url] = async(function () use ($client, $url) {
        $response = $client->request(new Request($url));
        return $response->getBody()->buffer();
    });
}

// Await all results (still non-blocking between them).
$results = [];
foreach ($futures as $url => $future) {
    $results[$url] = $future->await();
}

$elapsed = (hrtime(true) - $start) / 1e9;
printf("Amp concurrent total: %.3fs\n", $elapsed);

// Optional sanity check:
// foreach ($results as $url => $body) echo "$url => " . strlen($body) . " bytes\n";
```

Run:

```bash
php concurrent_amp.php
```

Expect ~2 seconds total (both 2s requests overlap), showing the concurrency win.

---

## What to say out loud in an interview

* “The sequential version blocks in `file_get_contents`, so total time ≈ sum of latencies.”
* “The Amp version spins up two Fibers with `async(...)`; the event loop multiplexes non-blocking sockets, so total time ≈ max of latencies.”
* “Same code style as sync, but built on **Fibers + event loop**. This pattern scales to many concurrent I/O ops—HTTP calls, DB over TCP, queues—without threads.”

If you want, I can add a quick **timeout/retry** wrapper or show how to **limit concurrency** (e.g., only 10 in flight) with a semaphore—both are common follow-ups.


# OPcache & JIT—when do they help?

    Already know it

# PSR highlights you actually use

Here’s the short list I actually reach for, plus why they matter and one-liner examples you can drop mid-interview.

### PSR-1 / PSR-12 — Basic & Extended Coding Style

* **Why:** Consistent code; every tool/IDE “just works.”
* **Sound bite:** “We enforce PSR-12 via PHP-CS-Fixer in CI so diffs stay meaningful.”

### PSR-4 — Autoloading

* **Why:** Zero `require` noise; clean package boundaries.
* **Example (`composer.json`):**

  ```json
  { "autoload": { "psr-4": { "App\\": "src/" } } }
  ```
* **Sound bite:** “Namespacing + PSR-4 makes refactors safe and mechanical.”

### PSR-3 — LoggerInterface

* **Why:** Drop in Monolog today, swap later; easy to stub in tests.
* **Example:**

  ```php
  use Psr\Log\LoggerInterface;
  final class SignupService {
    public function __construct(private LoggerInterface $log) {}
    public function handle(): void { $this->log->info('user.signup'); }
  }
  ```
* **Interview add-on:** structure logs and include a trace/request ID in a middleware.

### PSR-6 / PSR-16 — Cache

* **Why:** Interface first; local vs Redis vs Memcached without code churn.
* **Example (PSR-16 “simple cache”):**

  ```php
  use Psr\SimpleCache\CacheInterface;
  final class UserRepo {
    public function __construct(private CacheInterface $cache, private Db $db) {}
    public function byId(int $id): array {
      return $this->cache->remember("user:$id", 300, fn()=> $this->db->user($id));
    }
  }
  ```
* **Note:** Some libs expose helpers like `remember`; otherwise emulate with `get()`/`set()`.

### PSR-7 / PSR-15 / PSR-17 — HTTP Messages, Middleware, Factories

* **Why:** Framework-agnostic HTTP pipeline; test handlers in isolation.
* **Example (middleware skeleton):**

  ```php
  use Psr\Http\Message\ServerRequestInterface as Req;
  use Psr\Http\Message\ResponseInterface as Res;
  use Psr\Http\Server\MiddlewareInterface as MW;
  use Psr\Http\Server\RequestHandlerInterface as Handler;

  final class TraceMiddleware implements MW {
    public function process(Req $r, Handler $h): Res {
      $r = $r->withHeader('X-Trace', bin2hex(random_bytes(8)));
      $res = $h->handle($r);
      return $res->withHeader('X-Trace', $r->getHeaderLine('X-Trace'));
    }
  }
  ```
* **Factories (PSR-17):** create Request/Response/Stream without coupling to a concrete implementation.

### PSR-11 — ContainerInterface (DI)

* **Why:** Depend on **interfaces**, not the container’s brand; easy to swap/wire in tests.
* **Example:**

  ```php
  use Psr\Container\ContainerInterface;
  final class Controller {
    public function __construct(ContainerInterface $c) { /* pull factories only at edges */ }
  }
  ```
* **Caveat:** Prefer constructor injection for your *domain*; use the container at composition roots.

### PSR-14 — Event Dispatcher

* **Why:** Decouple side-effects (metrics, email) from core flows; supports multiple listeners.
* **Example:**

  ```php
  use Psr\EventDispatcher\EventDispatcherInterface;
  $dispatcher->dispatch(new UserSignedUp($userId));
  ```

### PSR-18 — HTTP Client

* **Why:** Interop for outbound HTTP; swap Guzzle, HTTPlug, Symfony HTTP client without rewrites.
* **Example:**

  ```php
  use Psr\Http\Client\ClientInterface;
  use Psr\Http\Message\RequestFactoryInterface;

  final class WebhookPoster {
    public function __construct(private ClientInterface $http, private RequestFactoryInterface $rf) {}
    public function send(string $url, string $json): void {
      $req = $rf->createRequest('POST', $url)->withHeader('Content-Type','application/json');
      $req->getBody()->write($json);
      $this->http->sendRequest($req);
    }
  }
  ```

### PSR-20 — Clock (newer but handy)

* **Why:** Time becomes injectable/testable; no hard `time()` calls.
* **Example:**

  ```php
  use Psr\Clock\ClockInterface;
  final class TokenService {
    public function __construct(private ClockInterface $clock) {}
    public function expiresAt(int $ttl): int { return $this->clock->now()->getTimestamp() + $ttl; }
  }
  ```

---

## How to package this in an interview

* “We standardize on PSR-12, PSR-4 for the basics. For cross-cutting concerns we rely on PSR-3 logging and PSR-6/16 caching interfaces. HTTP in and out is PSR-7/15/17 and PSR-18, which keeps frameworks and clients swappable. PSR-11 at the composition root only; domain code stays container-free. For time, PSR-20’s `ClockInterface` makes tests deterministic. Net effect: interoperability, testability, and painless refactors.”

If you want, I can sketch a tiny **PSR-15 pipeline + PSR-3/16 wiring** in a single file to show how these play together, or we can jump to your next question.


# Dependency Injection in PHP: container or manual?

Short answer you can say in an interview:

> Prefer **manual constructor injection** for your domain and business logic. Use a **container only at the composition root** (HTTP/CLI entry) to wire dependencies, scopes, and lifecycle. Never pull the container from inside your services (service-locator anti-pattern).

Here’s the fuller, practical take.

## When to use manual DI (default)

* **Clarity & testability:** constructor tells you exactly what a class needs; easy to stub in tests.
* **No framework lock-in:** domain code stays plain PHP; adapters can be swapped.
* **Fewer surprises:** no magic autowiring or reflection at runtime.

```php
// Domain
interface Notifier { public function send(string $to, string $msg): void; }

final class SignupService {
    public function __construct(
        private Notifier $notifier,
        private UserRepo $users,
    ) {}
    public function handle(string $email): void {
        $user = $this->users->create($email);
        $this->notifier->send($email, "Welcome {$user->name}");
    }
}
```

**Unit test with a stub** (no container needed):

```php
final class StubNotifier implements Notifier {
    public array $sent = [];
    public function send(string $to, string $msg): void { $this->sent[] = [$to, $msg]; }
}

public function test_signup_sends_welcome(): void {
    $svc = new SignupService(new StubNotifier, new InMemoryUserRepo);
    $svc->handle('a@b.com');
    $this->assertCount(1, $svc->notifier->sent);
}
```

## When a container helps (edges & scale)

* **Wiring a lot of objects** at the app boundary (controllers, handlers, resolvers).
* **Scopes & lifecycles:** per-request instances (logger with trace ID), singletons (config), pools (DB).
* **Conditional/plug-in resolution:** feature flags, environment-specific implementations.
* **Autowiring ergonomics:** reduce boilerplate in large apps (be explicit for domain).

Popular options: Symfony DI (compiled), Laravel’s container, PHP-DI (PSR-11), Laminas/Mezzio, Spiral.

**Composition root with a container (example using PSR-11):**

```php
// bootstrap.php
$container = (new AppContainerFactory())->build(); // returns ContainerInterface
$app = new HttpApp(
    router: new Router($container),      // router resolves controllers
    middleware: [new TraceMiddleware(), $container->get(AuthMiddleware::class)]
);
$app->run();
```

Your **domain services still use manual DI**; the container is only used to *assemble* them.

## What not to do (red flags)

* **Service Locator anti-pattern:**

  ```php
  final class BadService {
      public function __construct(private ContainerInterface $c) {}
      public function handle() { $mailer = $this->c->get(Mailer::class); /* ... */ }
  }
  ```

  Hides dependencies, hurts tests, couples code to the container.

* **Static singletons (global state):** hard to test, order-dependent bugs.

* **Leaking the framework/container into domain types:** makes future migrations painful.

## Autowiring: use with guardrails

* Fine for **infrastructure/edge** code (controllers, CLI commands).
* For **domain**, prefer **explicit constructors** and **interfaces**. If you keep autowiring, pin by interface and bind concrete in the container config.
* In Symfony, favor **compiled containers** (performance) and explicit aliases for interfaces.

## Lifetimes & scopes in PHP’s request model

* PHP is **short-lived per request** under FPM. Most services can be **transient** or **request-scoped**.
* Expensive objects (DB pools, HTTP client) can be **singletons** per worker process (initialized in bootstrap).
* Avoid holding request-specific state in singletons.

## Env/config separation

* Bind implementations per environment:

  * `Notifier` → `SesNotifier` in prod, `LogNotifier` in dev/tests.
  * Use factory services for resources needing credentials/region.
* Keep secrets in env/secret manager; pass typed config objects (immutable/readonly) into factories.

## Performance notes

* Use **compiled containers** (Symfony) to avoid reflection on hot paths.
* Cache container build artifacts; warm up at deploy.
* In Laravel, beware resolving in loops; resolve once and reuse.

## Interview sound bites

* *“Manual DI in the domain; container only at the composition root. That gives me explicit APIs, trivial tests, and still lets me manage lifecycles and wiring for the web layer.”*
* *“I avoid service-locator: classes depend on what they use, not a container. For large apps, autowiring is fine at the edges, but I bind interfaces explicitly so the domain stays framework-agnostic.”*
* *“Under PHP-FPM, most services are request-scoped; heavy clients are singletons per worker. In Symfony I use a compiled container; in Laravel, I keep resolution out of tight loops.”*

If you want, I can show the same `SignupService` wired three ways—pure manual, Symfony DI XML/YAML/PHP config, and PHP-DI definitions—so you can see the trade-offs line-by-line.

# Error handling best practices in 8.x

Here’s a practical, senior-friendly rundown you can use verbatim in an interview.

# Error handling best practices in PHP 8.x

## 1) Prefer exceptions; catch narrowly

* Throw and catch **exceptions**, not error codes or `false`.
* Catch **specific** exceptions where you can handle them; let others bubble.
* Default catch type is `Throwable` (covers `Exception` and engine `Error`s).

```php
try {
    $user = $repo->byEmail($email);           // may throw NotFound
    $mailer->sendWelcome($user);              // may throw TransportError
} catch (NotFound $e) {
    return $response->withStatus(404);
} catch (TransportError $e) {
    $log->error('mail.fail', ['err' => $e]);  // PSR-3
    return $response->withStatus(502);
}
```

## 2) Convert warnings/notices into exceptions (fail fast)

Avoid `@`-silencing. Turn PHP warnings into `ErrorException` during bootstrap so bugs don’t hide.

```php
error_reporting(E_ALL);
set_error_handler(static function (int $severity, string $msg, string $file, int $line): never {
    throw new ErrorException($msg, 0, $severity, $file, $line);
});
```

> Benefit: `json_encode`, `fopen`, etc. won’t quietly return false; they’ll raise immediately.

## 3) Use the 8.x exception zoo correctly

* **`TypeError`** (wrong type), **`ValueError`** (right type, invalid value), **`JsonException`** (with flags), **`PDOException`** (DB), etc.
* Don’t collapse everything to `\Exception`. Keep the semantic signal.

```php
$json = json_encode($payload, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
```

## 4) Design a small exception hierarchy for your domain

Have a root domain exception and specific subclasses. It makes mapping to HTTP/GraphQL clean.

```php
interface DomainException {}
final class NotFound extends RuntimeException implements DomainException {}
final class PermissionDenied extends RuntimeException implements DomainException {}
final class InvariantViolation extends LogicException implements DomainException {}
```

## 5) Map exceptions at the edges (HTTP / GraphQL)

* **HTTP (PSR-15 middleware):** translate exceptions → status + problem+json.
* **GraphQL:** map to `errors[].extensions` (don’t leak stack traces).

```php
// HTTP error middleware (simplified)
try { return $handler->handle($req); }
catch (NotFound)          { return problem(404, 'Not found'); }
catch (PermissionDenied)  { return problem(403, 'Forbidden'); }
catch (Throwable $e) {
    $log->error('unhandled', ['e'=>$e]);      // structured log
    return problem(500, 'Internal error');     // safe message
}
```

## 6) Always clean up with `finally`

Close resources, release locks, stop spans even if an exception is thrown.

```php
$pdo->beginTransaction();
try {
    // ... write operations ...
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw;
} finally {
    $metrics->increment('tx.finished');
}
```

## 7) Make responses safe in production

* Never show stack traces to users.
* Return **stable error shapes** (problem+json for REST; extensions for GraphQL).
* Include a **trace/request ID** in logs and responses for correlation.

## 8) Prefer total correctness flags over silent fallbacks

* `JSON_THROW_ON_ERROR`
* `FILTER_NULL_ON_FAILURE` (so you can branch on `null`)
* `mb_substitute_character('none')` for strictness, when relevant.

## 9) Use typed returns to avoid sentinel values

Don’t overload return types with `false`/`null`. Either throw, or return `?T` intentionally and document semantics.

```php
function thumbnail(Path $p): Image  // throws NotFound|DecodeError
```

## 10) Structured logging and alerting

* Log with **PSR-3** and structured context (arrays).
* Centralize via Sentry/DataDog/etc. (uncaught exception handler).
* Rate-limit noisy errors; group by fingerprint.

```php
set_exception_handler(static function (Throwable $e) use ($log): void {
    $log->critical('uncaught', ['ex' => $e, 'trace_id' => Trace::id()]);
});
```

## 11) Don’t abuse exceptions for control flow

Throw for exceptional/invalid states, not for expected branches (use `if`/`match` or validated input).

## 12) Be explicit about “never returns”

Functions that always throw or exit can declare `never` (8.1+). It helps static analysis.

```php
function fail(string $msg): never { throw new RuntimeException($msg); }
```

## 13) Library boundaries: wrap and chain (`previous`)

Wrap vendor exceptions in your domain types, preserve the original via `$previous`.

```php
try { $db->save($u); }
catch (PDOException $e) { throw new InvariantViolation('user save failed', 0, $e); }
```

## 14) Validate inputs at the edge; trust inside

Parse/validate/normalize HTTP/CLI/env inputs into **typed DTOs** once; throw early. Past that, your services receive safe types.

## 15) Testing strategy

* Unit tests assert **exception types and messages**.
* Contract tests ensure HTTP/GraphQL error shapes are stable.
* Chaos tests: simulate DB timeouts, partial failures, and confirm correct retries/rollbacks.

```php
$this->expectException(NotFound::class);
$svc->getUser(999);
```

---

### Quick “interview answer” version

> “In PHP 8.x I convert warnings to exceptions, use typed exceptions (including `ValueError`/`TypeError`), and keep a small domain exception tree. I catch narrowly where I can act, and at the edges I translate to stable error responses (problem+json/GraphQL extensions) while logging with PSR-3 and a trace ID. I wrap DB writes in transactions with `try/catch/finally`, never expose traces in prod, and use strict flags like `JSON_THROW_ON_ERROR`. For legacy APIs that return `false`, I normalize to exceptions so the rest of the codebase stays consistent.”

If you want, I can drop in a tiny **problem+json responder** and a **GraphQL error formatter** you can paste into a project to practice the pattern.

# PDO prepared statements vs query building

This is a bread-and-butter database safety + maintainability question. They want to hear you understand SQL injection risks, performance, and ergonomics.

---

## Prepared statements with PDO

**What they are**

* You write SQL with placeholders (`?` or named `:param`).
* Database parses/optimizes once; values are bound safely.
* Prevent SQL injection automatically.

**Example**

```php
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();
```

**Why good**

* Safe: parameters are escaped properly.
* Fast: reused queries can skip re-parsing (esp. in long-lived connections).
* Clear: separates structure (SQL) from data (bindings).

---

## Query building

**What it means**

* Dynamically building SQL strings in PHP, usually by concatenation or helper functions.
* Can be *safe* if you still bind params via placeholders.
* Some projects use ORMs or builders (Doctrine, Eloquent, Atlas, etc.) to generate SQL.

**Example (unsafe)**

```php
$sql = "SELECT * FROM users WHERE email = '$email'"; // 🚨 injection risk
```

**Example (safe with builder)**

```php
$query = $qb->select('*')
    ->from('users')
    ->where('email = :email')
    ->setParameter('email', $email);
```

**Why use a builder**

* Complex queries with conditional clauses, joins, dynamic filters are easier to compose.
* Prevents typos in string concatenation.
* Can abstract dialect differences.

**Downside**

* More abstraction, less visibility into raw SQL.
* Can be slower to learn/debug than prepared PDO.

---

## PDO vs builders — how to decide

* **Simple cases:** prepared statements directly in PDO are perfect.
* **Complex dynamic filters (search screens, reporting):** a query builder or ORM is easier to maintain.
* **Always:** make sure the builder still uses prepared statements under the hood (and almost all do).

---

## Interview phrasing

> “I use PDO prepared statements by default because they prevent injection and clearly separate query structure from data. For complex dynamic queries I’ll reach for a query builder or ORM, but those still rely on prepared statements under the hood. What I avoid is hand-concatenating SQL with untrusted input — it’s brittle and insecure.”

---

Want me to also show you how **PDO’s emulated prepares** differ from **native prepares** (and why you sometimes want to turn emulation off)? That’s a nice detail to sprinkle in.

# Transactions and isolation

It absolutely is a question — and a sneaky one. They’re not testing whether you can write `BEGIN`/`COMMIT`; they want to hear that you understand *why* transactions exist, what isolation levels mean, and how you’d use them in PHP code.

---

## Transactions in PHP (with PDO)

* **Purpose:** group multiple SQL statements into an **atomic unit**. Either all succeed, or none persist.

* **Common pattern:**

  ```php
  $pdo->beginTransaction();
  try {
      $pdo->exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
      $pdo->exec("UPDATE accounts SET balance = balance + 100 WHERE id = 2");
      $pdo->commit();
  } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
  }
  ```

* Wrap in `try/catch/finally` so you **always rollback** on failure.

---

## Isolation levels (the subtle bit)

Isolation is about **how concurrent transactions interact**. SQL standard defines 4 levels:

1. **READ UNCOMMITTED** — can see uncommitted data (dirty reads). Rarely used.
2. **READ COMMITTED** — each query sees only committed data. Prevents dirty reads. Default in PostgreSQL.
3. **REPEATABLE READ** — within a transaction, a repeated query sees the same rows, even if others commit changes. Prevents non-repeatable reads. Default in MySQL/InnoDB.
4. **SERIALIZABLE** — transactions behave as if run one after another. Strongest; prevents phantom reads; slowest.

---

## How it matters for PHP apps

* **Most web apps** stick with DB default (`READ COMMITTED` or `REPEATABLE READ`), good balance of consistency and performance.
* **Money/accounting/booking systems** often require **SERIALIZABLE** or explicit locks to prevent double booking.
* **High-concurrency analytics** may tolerate weaker isolation for speed (but you must reason about anomalies).

---

## PHP code: changing isolation level

```php
$pdo->exec("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
$pdo->beginTransaction();
// … critical section …
$pdo->commit();
```

---

## Best practices

* **Keep transactions short** — don’t hold DB locks across long PHP calls.
* **Idempotency + retries** — SERIALIZABLE can deadlock; write code to catch deadlock errors and retry.
* **Use optimistic patterns** (e.g. version numbers) for high-contention rows.
* **Business logic inside the DB vs in PHP:** critical invariants (like ensuring balance never negative) should be enforced with constraints/triggers, not just app code.

---

## Interview phrasing

> “In PHP I wrap multi-statement writes in transactions with try/commit/rollback. For isolation, I usually accept the DB’s default (`READ COMMITTED` in Postgres, `REPEATABLE READ` in MySQL). If I need stronger invariants — like preventing double booking — I’ll raise isolation to `SERIALIZABLE` or use explicit locks, but always with retries for deadlocks. The key is: transactions give atomicity, and isolation levels control what anomalies we’re willing to tolerate under concurrency.”

---

Want me to also give you a **cheat-table of anomalies (dirty read, non-repeatable read, phantom)** and which isolation levels prevent them? That’s sometimes exactly what an interviewer follows up with.


# DateTimeImmutable vs DateTime

    Already know its

# SPL & iterators you should know

Perfect — this is one of those “you’ve been around PHP long enough, do you know its standard library?” questions.

---

## What is SPL?

**SPL = Standard PHP Library.**

* It’s a collection of **built-in interfaces, classes, and iterators** that ship with PHP.
* Provides common data structures (heaps, queues, stacks), iterators (to traverse collections in custom ways), and utilities (spl_autoload_register, SplFileInfo, etc.).
* Idea: give PHP developers “batteries included” without third-party code.

---

## SPL Iterators you should know

These are like Lego blocks — you can chain them for lazy transformations.

1. **IteratorIterator**

   * Wraps an iterator so you can treat any Traversable uniformly.
   * Often used as a base wrapper.

2. **RecursiveIteratorIterator**

   * Traverses nested structures (like directories) depth-first.
   * Common with `RecursiveDirectoryIterator`.

   ```php
   $dir = new RecursiveDirectoryIterator('/tmp');
   $it  = new RecursiveIteratorIterator($dir);
   foreach ($it as $file) echo $file, "\n";
   ```

3. **FilterIterator / CallbackFilterIterator**

   * Filters items lazily.

   ```php
   $it = new CallbackFilterIterator(new ArrayIterator([1,2,3,4]), fn($x)=>$x%2===0);
   foreach ($it as $v) echo $v; // 2,4
   ```

4. **RegexIterator**

   * Filters/matches keys or values using regex.
   * Example: match only `.php` files from a DirectoryIterator.

5. **CachingIterator**

   * Wraps another iterator, lets you “look ahead” or “rewind” more flexibly.

6. **LimitIterator**

   * Slice of another iterator (like `array_slice` but lazy).

---

## SPL Data Structures

Handy for algorithm questions and production code:

* **SplStack** (LIFO), **SplQueue** (FIFO).
* **SplPriorityQueue** — insert items with priorities, extract highest first.
* **SplHeap**, **SplMinHeap**, **SplMaxHeap** — heaps for efficient top-k problems.

Example (priority queue):

```php
$q = new SplPriorityQueue();
$q->insert('task-low', 1);
$q->insert('task-high', 10);
echo $q->extract(); // task-high
```

---

## Other SPL gems

* **SplFileInfo / DirectoryIterator / RecursiveDirectoryIterator** — robust filesystem traversal.
* **SplObjectStorage** — set/map keyed by object identity (great for graph algorithms).
* **spl_autoload_register** — plug in your own autoloader.

---

## Why interviewers ask about this

They’re probing:

* Do you know PHP isn’t just `foreach($arr)`?
* Can you use built-in, efficient data structures instead of reinventing wheels?
* Can you reason about lazy vs eager evaluation (iterators are lazy)?

---

## Interview phrasing

> “SPL is the Standard PHP Library — a set of iterators, data structures, and utilities baked into PHP. For iterators I actually use CallbackFilterIterator, RegexIterator, and RecursiveIteratorIterator a lot — e.g. walking a directory tree and filtering by extension. For data structures I like SplPriorityQueue and SplHeap for algorithmic problems. The big win is they’re lazy and efficient, so you don’t need to load everything into arrays.”

---

Want me to also give you a **cheat table of which SPL iterator matches which common use case** (filter, map, flatmap, directory walk, etc.) so you can memorize a few examples?

# 14. Streams & large files

Good one — this is all about memory management and scalability. If an interviewer asks it, they’re checking whether you know that `file_get_contents()` is **not** the tool for a 10-GB log file.

---

## PHP streams in a nutshell

* **Streams** unify file, socket, HTTP, memory, and filter operations under one API.
* Anything you `fopen()` in PHP is a stream: local files, `php://` wrappers, network connections.
* You read/write in chunks instead of slurping everything.

```php
$fh = fopen('large.csv', 'rb');
while (!feof($fh)) {
    $line = fgets($fh);
    // process one line at a time
}
fclose($fh);
```

---

## Why streams matter for large files

* **Memory efficiency:** you don’t load the whole file into RAM.
* **Backpressure control:** you can throttle reads/writes, avoid out-of-memory.
* **Filters:** apply transforms (compression, base64, string replace) *on the fly*.

---

## Useful stream wrappers

* `php://stdin`, `php://stdout`, `php://stderr` — CLI.
* `php://memory` and `php://temp` — temp in-memory streams (spill to disk after a threshold).
* `php://filter` — inline filters (e.g. `fopen("php://filter/read=string.toupper/resource=foo.txt")`).
* `compress.zlib://file.gz` — transparent compression.

---

## Example: safe large file copy with streams

```php
$in  = fopen('huge.mov', 'rb');
$out = fopen('copy.mov', 'wb');

stream_copy_to_stream($in, $out);  // efficient, chunked under the hood

fclose($in);
fclose($out);
```

---

## Example: CSV streaming (don’t slurp)

```php
$fh = fopen('big.csv', 'rb');
while (($row = fgetcsv($fh)) !== false) {
    // process $row
}
fclose($fh);
```

---

## Networking with streams

* `fopen("tcp://host:port", 'r+')` → sockets as streams.
* Use `stream_select()` for non-blocking multiplexing.
* Async libraries (Amp, ReactPHP) build on these low-level primitives.

---

## Common pitfalls

* `file_get_contents()` is fine for configs, but dangerous for multi-GB logs.
* `fpassthru()` echoes directly — can overwhelm buffers if not careful.
* Forgetting to `fclose()` → leaks file descriptors.
* Ignoring character encodings — prefer `mb_convert_encoding` or filters if you’re processing text.

---

## Interview phrasing

> “For large files I always use PHP’s stream API: open with `fopen` and process chunk-by-chunk. That keeps memory flat regardless of file size. Streams also let me use filters like gzip decompression transparently. For network I/O, sockets are exposed as streams too, and libraries like ReactPHP build non-blocking event loops on top. The main rule is: avoid `file_get_contents()` for multi-GB data; always stream.”

---

Do you want me to also give you a **cheat-table of common stream functions** (`stream_get_contents`, `stream_copy_to_stream`, `stream_filter_append`, etc.) so you can rattle off a few in the interview?

# 15. Serialization & JSON pitfalls

This is a sneaky-good interview topic because it blends **security**, **correctness**, and **interoperability**. Let’s unpack both *serialization* and *JSON* in PHP.

---

## 1. PHP’s native `serialize()` / `unserialize()`

* **What it does:** Converts PHP values into a storable string, and back.

  ```php
  $s = serialize(['a' => 1, 'b' => 2]);
  $data = unserialize($s);
  ```

* **Pitfalls:**

  * **Security risk**: `unserialize()` on untrusted input is a classic vulnerability (object injection, gadget chains → RCE).
  * **Portability**: Format is PHP-specific. Not friendly for APIs or cross-language.
  * **Version issues**: Different PHP versions may not serialize objects identically.
  * **Binary data**: Embedded safely, but opaque/hard to inspect.

* **Best practice:**

  * Don’t expose `unserialize()` to user input.
  * Prefer JSON or other cross-language formats.
  * If you need local persistence: use `igbinary` (faster, safer), or explicit DTOs.

---

## 2. JSON (`json_encode` / `json_decode`)

* **Why better:** Interoperable, human-readable, supported everywhere.

* **Example:**

  ```php
  $json = json_encode($data, JSON_THROW_ON_ERROR);
  $arr  = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
  ```

* **Pitfalls:**

  1. **Silent failure by default**

     * Without flags, `json_encode()`/`decode()` return `false` or `null` on error.
     * Fix: use `JSON_THROW_ON_ERROR` to get exceptions.

  2. **UTF-8 only**

     * JSON requires UTF-8. Invalid sequences cause errors.
     * Fix: `JSON_INVALID_UTF8_SUBSTITUTE` replaces bad chars.

  3. **Large integers**

     * By default, values > 2^53 lose precision (encoded as float).
     * Fix: use `JSON_BIGINT_AS_STRING` on decode, or encode them as strings.

  4. **Booleans/nulls**

     * PHP null ↔ JSON null works.
     * But PHP associative arrays with numeric keys can turn into JSON arrays, then decode back differently.

  5. **Depth limit**

     * Default recursion depth = 512. Deep structures can throw `Recursion detected`.
     * Fix: raise depth param if needed, but check for cycles.

* **Safe flags combo I usually use:**

  ```php
  $json = json_encode($data, 
      JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PRESERVE_ZERO_FRACTION
  );
  $arr = json_decode($json, true, 512, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
  ```

---

## 3. Alternatives

* **MessagePack / Protobuf / Avro** for compact or schema’d formats.
* **igbinary** (PHP extension) for efficient intra-PHP serialization (sessions, cache).
* Still: JSON is the default for APIs.

---

## Interview phrasing

> “I avoid `unserialize()` on untrusted data, since it’s exploitable. For APIs, I use JSON with safe flags: `JSON_THROW_ON_ERROR` so encoding/decoding doesn’t silently fail, `JSON_INVALID_UTF8_SUBSTITUTE` to guard against bad input, `JSON_PRESERVE_ZERO_FRACTION` so floats like `1.0` don’t collapse to `1`, and `JSON_BIGINT_AS_STRING` to keep large IDs accurate. That way serialization is safe, portable, and predictable.”

---

Want me to also give you a **demo of the integer precision bug** (where `json_encode([9223372036854775807])` mangles the number)? That’s a killer “gotcha” story for interviews.

# 16. 
Yep — this one comes up constantly because *every* PHP dev is assumed to have scars from the “bad old days.” Interviewers want to see you know the **fundamental attack classes** and the **modern built-ins** that mitigate them. Here’s the compact but deep list you can use:

---

## 1. Password handling

* **Never roll your own hash.**

  * Use `password_hash()` with `PASSWORD_DEFAULT` (bcrypt/argon2).
  * Verify with `password_verify()`.
  * Rehash with `password_needs_rehash()` as cost/algorithms improve.
* Why: slow, salted, upgradeable.

---

## 2. SQL injection

* **Always use prepared statements.**

  * PDO with bound params (`:id`).
  * Query builders/ORMs that use prepared statements under the hood.
* Never concatenate user input into SQL strings.

---

## 3. XSS (Cross-Site Scripting)

* **Escape output in the right context:**

  * HTML → `htmlspecialchars($val, ENT_QUOTES, 'UTF-8')`.
  * JS → `json_encode($val)` when embedding into scripts.
  * URL → `rawurlencode()`.
* Use templating engines that auto-escape (Twig, Blade).
* Defense-in-depth: Content Security Policy (CSP).

---

## 4. CSRF (Cross-Site Request Forgery)

* **Synchronizer token pattern:** generate token in session, embed in forms, verify on POST.
* Use `SameSite` cookies (`Lax`/`Strict`) to cut attack surface.
* Many frameworks (Symfony, Laravel) have CSRF middleware built in.

---

## 5. Session security

* Use `session_start([ 'cookie_secure'=>true, 'cookie_httponly'=>true, 'cookie_samesite'=>'Strict' ])`.
* Rotate session ID after login (`session_regenerate_id(true)`).
* Store session state server-side; avoid exposing it in URLs.
* Prefer Redis/memcached session stores in distributed setups.

---

## 6. Input validation

* Validate/normalize **at the edge** (HTTP, CLI).
* Use strict types (`int`, `float`, `enum`) once parsed.
* Never trust `$_GET`/`$_POST` directly in core logic.
* Libraries: Symfony Validator, filter_var with flags.

---

## 7. File uploads

* Always verify MIME type and extension.
* Store outside webroot or randomize names.
* Don’t execute or include them.
* Limit size; stream large files.

---

## 8. Error handling

* Don’t leak stack traces to users.
* Centralize exception handling:

  * HTTP: return problem+json.
  * GraphQL: map to `errors[].extensions`.
* Log details with PSR-3 logger + trace ID.

---

## 9. Cryptography

* Use libsodium (built into PHP 7.2+).
* `sodium_crypto_secretbox` for symmetric; `sodium_crypto_box` for public-key.
* Never DIY crypto with `md5` or `sha1`.

---

## 10. HTTP/Transport

* Always force HTTPS.
* Set security headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`.
* Sanitize redirects (`Location:` header should not echo user input).
* Rate-limit login/brute force attempts.

---

## Interview phrasing

> “I follow the basics: `password_hash`/`verify` for passwords, prepared statements for SQL, output escaping for XSS, CSRF tokens for unsafe HTTP verbs, and secure session cookies with rotation. I validate input at the edge, never trust globals directly, and never show stack traces in prod. For crypto I stick to libsodium. Frameworks cover a lot of this, but I understand the primitives and when to enforce them manually.”

---

Want me to also build you a **one-page “security checklist”** (like a laminated card you can study) covering these 10 areas with the exact PHP functions you’d name-drop? That way you can recall under interview pressure.

# 17. Testing stack & doubles

This one is all about showing you know how to structure **tests in PHP**, and what kinds of **test doubles** (mocks, stubs, fakes, spies) you use. Interviewers want to see that you’ve lived through building maintainable tests, not just “I ran PHPUnit once.”

---

## Testing stack in PHP

**Typical layers you’d mention:**

* **Unit tests** — PHPUnit, Pest. Small, fast, isolated.
* **Integration tests** — hit DB, cache, or HTTP endpoints; still automated, run in CI.
* **End-to-end (E2E)** — simulate HTTP requests (Symfony’s KernelTestCase, Laravel’s HTTP tests, Guzzle against local server).
* **Static analysis** — PHPStan/Psalm for type & flow checks (complements tests).
* **Mutation testing** (infection/infection): check if your tests actually catch bugs.
* **Coverage tools** — Xdebug or PCOV to measure line/branch coverage.

---

## Test doubles (the taxonomy)

* **Dummy**: passed around but never used. Example: constructor param you don’t care about.
* **Stub**: provides canned responses, no logic.

  ```php
  class StubNotifier implements Notifier {
      public function send(string $to, string $msg): void {}
  }
  ```
* **Fake**: lightweight working implementation (like an in-memory repo instead of a DB).

  ```php
  class InMemoryUserRepo implements UserRepo {
      private array $data = [];
      public function save(User $u): void { $this->data[$u->id] = $u; }
      public function byId(int $id): ?User { return $this->data[$id] ?? null; }
  }
  ```
* **Mock**: pre-programmed with expectations; fails test if not met. Often created with PHPUnit’s mocking API.

  ```php
  $mailer = $this->createMock(Mailer::class);
  $mailer->expects($this->once())
         ->method('send')
         ->with('a@b.com', 'Welcome!');
  ```
* **Spy**: records how it was called so you can assert afterward. (Sometimes a stub + assertions.)

---

## Best practices

* **Default to fakes/stubs** for unit tests: fast, stable, no brittle expectation wiring.
* **Reserve mocks** for collaboration tests (did service A actually call B?).
* **Integration tests** with real DB/Redis/HTTP clients: ensure wiring works.
* **Don’t overspecify** — if you assert every call param in every test, you’ll break tests on harmless refactors.
* **In-memory doubles** (fakes) are great for repositories: they act like the real thing but no I/O.
* **Factories/fixtures**: build realistic test data with libraries like `fzaninotto/faker` or your own factories.

---

## Interview phrasing

> “My PHP testing stack is PHPUnit or Pest for unit tests, with fakes and stubs for dependencies. For integration I run tests against a real DB and cache in containers. I prefer fakes over mocks — for example, an in-memory repo — because they keep tests fast and stable. When I need to verify a collaboration, I’ll use PHPUnit mocks or spies. Static analysis with PHPStan complements the suite. Together, it gives fast feedback on logic and confidence that the system wiring works.”

---

Want me to also show you a **unit test with all four double types (stub, fake, mock, spy) against the same `SignupService`** we’ve been using? That makes it super clear when to choose each.


# 18. Caching tiers & invalidation

Let’s make you dangerous on caching—both the “what” and the “how do I not shoot my future self.”

# Caching tiers (stacked from nearest to farthest)

1. **In-process (per-worker)**

* Examples: static memoization, APCu.
* Fastest, but disappears on process restart and isn’t shared across workers.
* Great for pure function results, config blobs, regex compilations.

2. **HTTP layer**

* Browser cache (Cache-Control, ETag), reverse proxy (Varnish, Nginx), CDN (Cloudflare/Fastly).
* Best for **idempotent GETs** and public resources. Surrogate keys let you invalidate many pages at once.

3. **Distributed cache**

* Redis/Memcached (PSR-6/PSR-16). Cross-worker, millisecond latencies. Your main app data cache.

4. **Storage/index caches**

* DB/materialized views, search indices, precomputed aggregates. Not “cache” in code, but serves the same purpose.

# Core patterns (know these by name)

* **Cache-aside (lazy)**: read-through on miss, write to cache on success.
* **Write-through**: every DB write also writes cache immediately.
* **Write-behind**: enqueue update to refresh cache later (eventually consistent).
* **Read-through**: library hides cache/DB—less common in PHP but similar to cache-aside.

# Keys & invalidation (the sharp bits)

* **Key design:** include identity + version:

  * `user:{id}:v{ver}`
  * For queries: normalize parameters, sort filters, paginate keys: `tracks:vibe=focus:limit=20:after=abc`
* **Versioned keys beat deletes:** bump a version (e.g., on user update) → old entries fall out naturally.
* **Event-driven invalidation:** on write, publish events (Kafka/Redis pubsub) consumers nuke/refresh affected keys (surrogate keys at HTTP/CDN layer).

# Stampede (dogpile) protection

* **Per-key lock**: first miss computes; others wait or serve stale.
* **Stale-while-revalidate (SWR)**: serve slightly stale value if TTL soft-expired, kick off async refresh.
* **Jitter**: randomize TTL by ±10–20% to avoid thundering herds.

# TTL strategy

* **Hot dynamic data:** low TTL + SWR.
* **Rarely changing:** long TTL + explicit busting (version key).
* **Negative caching:** cache “not found” briefly to stop repeated misses (but short TTL to avoid hiding new data).

# PHP wiring (PSR-16 example with lock + SWR)

```php
final class CacheHelper
{
    public function __construct(
        private Psr\SimpleCache\CacheInterface $cache,
        private Redis $redis,                           // for locks
        private int $ttl = 300,                         // hard TTL
        private int $stale = 120                        // SWR window
    ) {}

    public function remember(string $key, callable $compute) {
        $packed = $this->cache->get($key);
        if ($packed) {
            [$value, $exp, $staleUntil] = $packed;
            $now = time();
            if ($now <= $exp) return $value;           // fresh
            if ($now <= $staleUntil) {                 // stale but acceptable → async refresh
                $this->refreshAsync($key, $compute);
                return $value;
            }
        }
        return $this->refreshSync($key, $compute);     // miss
    }

    private function refreshSync(string $key, callable $compute) {
        $lock = "lock:$key";
        if ($this->acquire($lock, 10)) {
            try {
                $val = $compute();
                $this->store($key, $val);
                return $val;
            } finally { $this->release($lock); }
        }
        // someone else is computing; brief wait then try cache again
        usleep(100_000);
        $packed = $this->cache->get($key);
        return $packed ? $packed[0] : null;
    }

    private function refreshAsync(string $key, callable $compute): void {
        // fire-and-forget; in real code enqueue a job
        if ($this->acquire("lock:$key", 10)) {
            try { $this->store($key, $compute()); } finally { $this->release("lock:$key"); }
        }
    }

    private function store(string $key, mixed $value): void {
        $now = time();
        $exp = $now + $this->ttl;
        $staleUntil = $exp + $this->stale;
        // jitter ±10%
        $jitter = random_int(-$this->ttl/10, $this->ttl/10);
        $this->cache->set($key, [$value, $exp, $staleUntil], $this->ttl + $this->stale + $jitter);
    }

    private function acquire(string $key, int $ttl): bool {
        // NX EX lock
        return (bool)$this->redis->set($key, '1', ['nx', 'ex' => $ttl]);
    }
    private function release(string $key): void { $this->redis->del($key); }
}
```

> Interview note: name “cache-aside + SWR + per-key lock + TTL jitter.”

# CDN/HTTP cache specifics

* **Cache-Control**: `public, max-age=300, stale-while-revalidate=120, stale-if-error=600`
* **ETag**/`Last-Modified`: validators so clients revalidate cheaply.
* **Surrogate-Key headers**: tag responses by entity IDs; purge by tag when an entity changes (Fastly, Cloudflare).

# GraphQL-specific tips

* Prefer **field-level caching** for pure resolvers (idempotent, args → value).
* Batch with **DataLoader** to avoid N+1; cache within request, and optionally short-TTL cross-request.
* Connection keys include pagination args; cache pages separately.
* Use **response cache** only for anonymous or role-stable queries (vary by user/roles).

# Consistency & correctness

* Decide tolerance:

  * **Read-your-writes** needed? Use write-through or bump version atomically with DB write.
  * **Eventual consistency** OK? Use cache-aside + SWR; document freshness guarantees.
* **Idempotent writers** + **retries**: when refreshing caches on events, ensure repeated messages don’t corrupt.

# Eviction & sizing

* Choose eviction policy (LRU/LFU) in Redis/Memcached; monitor hit ratio.
* Compress large values (`igbinary`, Redis `lz4`) if bandwidth/memory is tight.
* Avoid mega-objects; prefer **sharded keys** (e.g., `post:{id}:field`) to update targeted slices.

# Observability

* Emit counters: hits, misses, stale-served, recompute time, lock waits.
* Dashboard for top keys by size/time and stampede incidents.
* Log cache key on slow requests for debuggability.

# Quick interview sound bites

* “Default to **cache-aside** with **per-key locks** to prevent stampedes, **SWR** to smooth load, and **TTL jitter** to avoid synchronized expiry.”
* “Keys are **versioned**; writes bump the version so invalidation is O(1) without scanning.”
* “At the edge we use **ETag + surrogate keys** so a user update can purge all affected pages in one shot.”
* “In GraphQL we batch with DataLoader and cache pure resolvers; we vary response cache by role, not just user.”

If you want, we can tailor a key schema + invalidation plan for your **playlist/vibes** API and drop it into your PHP code with PSR-16 + Redis in ~20 lines.

# 19. Middleware pattern (PSR-15)

Here’s the “know-it-cold” take on PSR-15 middleware—what it is, why it exists, and how to use it without foot-guns.

# What PSR-15 is

* **PSR-15** defines interfaces for **HTTP server middleware** and **request handlers**.
* It pairs with **PSR-7** (immutable Request/Response objects) and **PSR-17** (factories).
* Goal: framework-agnostic pipelines (works with Mezzio, Slim, Symfony bridge, etc.).

Core interfaces:

```php
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as Handler;

interface Middleware {
    public function process(Request $request, Handler $handler): Response;
}

interface Handler {
    public function handle(Request $request): Response;
}
```

# Mental model

A **chain** of functions around a final handler:

* Each middleware can **(a)** do work “before,” **(b)** optionally short-circuit (return a Response), or **(c)** call `$handler->handle($request)` and then do “after” work.

Order matters. Think: logging → auth → rate limit → routing → controller.

# Minimal pipeline you can paste anywhere

```php
final class Pipeline implements Handler {
    /** @var list<Middleware> */
    private array $stack;
    private Handler $last;

    public function __construct(array $stack, Handler $last) {
        $this->stack = array_values($stack);
        $this->last  = $last;
    }

    public function handle(Request $req): Response {
        if (!$this->stack) return $this->last->handle($req);
        $mw = array_shift($this->stack);
        return $mw->process($req, $this);
    }
}
```

Example middlewares:

```php
final class TraceMiddleware implements Middleware {
    public function __construct(private \Psr\Log\LoggerInterface $log) {}
    public function process(Request $r, Handler $h): Response {
        $trace = bin2hex(random_bytes(8));
        $r = $r->withAttribute('trace_id', $trace);
        $this->log->info('req.start', ['trace'=>$trace, 'path'=>$r->getUri()->getPath()]);
        $res = $h->handle($r);
        return $res->withHeader('X-Trace-Id', $trace);
    }
}

final class AuthMiddleware implements Middleware {
    public function process(Request $r, Handler $h): Response {
        $auth = $r->getHeaderLine('Authorization');
        if ($auth === '' /* or invalid */) {
            // build a 401 using PSR-17:
            $rf = new \Nyholm\Psr7\Factory\Psr17Factory();
            $res = $rf->createResponse(401);
            return $res->withHeader('WWW-Authenticate', 'Bearer');
        }
        return $h->handle($r->withAttribute('user_id', 42));
    }
}
```

Wire it:

```php
$pipeline = new Pipeline(
  [ new TraceMiddleware($logger), new AuthMiddleware() ],
  new class implements Handler {
      public function handle(Request $r): Response {
          $rf = new \Nyholm\Psr7\Factory\Psr17Factory();
          $res = $rf->createResponse(200);
          $res->getBody()->write("Hello user ". $r->getAttribute('user_id'));
          return $res;
      }
  }
);
```

# Best practices (what interviewers want to hear)

* **Immutability:** PSR-7 objects are immutable. Use `withHeader()`, `withAttribute()`, `withBody()` to get new instances—don’t mutate.
* **Do one thing per middleware:** auth, rate-limit, caching, logging, CSRF, compression, error handling.
* **Short-circuit cleanly:** return a Response early for 401/403/429, maintenance mode, cached hits.
* **Error boundary:** wrap the pipeline in an error-handling middleware that catches `Throwable`, logs, and returns a safe Problem+JSON 500 response.
* **Ordering is policy:** e.g., tracing first, then request‐size limits, then auth, then rate limit (maybe per user), then caching, then routing/controller.
* **No global state:** pass data via request attributes (`$request->withAttribute('user', $user)`).
* **Testing:** each middleware is trivial to unit test—pass in a fake Handler that records the request or returns a canned Response.

# Common patterns you can name-drop

* **Before/after sandwich:** modify request → `$handler->handle()` → decorate response (e.g., add `X-Trace-Id`).
* **Timeout/Deadline middleware:** store a deadline in attributes; downstream I/O honors it.
* **Rate limiting:** bucket check; return 429 or add `X-RateLimit-*` headers.
* **Response caching:** hash (method, URL, vary headers); on hit return cached response; on miss, run handler and store.
* **Localization:** parse `Accept-Language`, set `locale` attribute, inject translator.

# GraphQL angle (nice bonus)

* Put **auth, complexity & depth limits, and rate limiting** as PSR-15 middleware **before** the GraphQL HTTP endpoint.
* Inside GraphQL resolve path: use **DataLoader** request-scoped cache separate from PSR-15 layer.

# Pitfalls to avoid

* **Consuming the body twice**: if you read the stream, rewind/replace it (`$stream->rewind()` or buffer and `createStream()`).
* **Side effects after response is sent**: do async/queue work instead of heavy post-processing.
* **Leaky ordering**: e.g., caching before auth can leak private data; ensure `Vary`/keys include auth context or place caching after auth with role-aware keys.

# Tiny error middleware (copy-paste)

```php
final class ErrorMiddleware implements Middleware {
    public function __construct(private \Psr\Log\LoggerInterface $log, private \Psr\Http\Message\ResponseFactoryInterface $rf) {}
    public function process(Request $r, Handler $h): Response {
        try { return $h->handle($r); }
        catch (\Throwable $e) {
            $this->log->error('unhandled', ['ex'=>$e, 'trace_id'=>$r->getAttribute('trace_id')]);
            $res = $this->rf->createResponse(500)->withHeader('Content-Type','application/problem+json');
            $res->getBody()->write(json_encode(['type'=>'about:blank','title'=>'Internal Server Error'], JSON_THROW_ON_ERROR));
            return $res;
        }
    }
}
```

# Interview sound bite

> “PSR-15 gives me a clean HTTP pipeline: each middleware does one cross-cutting concern, passes an immutable PSR-7 request to the next handler, and can short-circuit with a response. I put tracing and limits up front, auth before caching, and wrap the whole chain in an error middleware. That keeps concerns isolated, testable, and framework-agnostic.”

Want me to bundle a tiny runnable example (Nyholm PSR-7 + a few middlewares) you can execute with PHP’s built-in server for practice?

# 20. Deploy/ops knobs that actually matter

This is the “show me you’ve shipped PHP in production” question. They don’t want a laundry list; they want to know you understand *which knobs move the needle* and why.

---

# Deploy/ops knobs that actually matter for PHP apps

### 1. PHP runtime

* **OPcache**:

  * `opcache.enable=1`, `opcache.memory_consumption`, `opcache.max_accelerated_files`.
  * **Knob:** `validate_timestamps=0` + atomic deploys + FPM reload → best perf.
* **JIT**: only if you’ve profiled CPU-bound workloads; ignore otherwise.
* **APCu**: request-local in-memory cache for very hot config lookups.

### 2. PHP-FPM process manager

* **pm settings**: `dynamic` vs `ondemand`.

  * Tune `pm.max_children` to DB connections and memory per worker.
* **Knobs that matter:** `pm.max_requests` (recycle to avoid leaks), `pm.status_path` for metrics.
* **Trick:** if you OOM, lower children, don’t crank RAM blindly.

### 3. Error/exception handling

* **Display_errors=0 in prod** (don’t leak).
* Log via PSR-3 to centralized system (Sentry, ELK, Datadog).
* `set_error_handler` + `set_exception_handler` for safety nets.

### 4. Logging & observability

* **Structured logs** (JSON, include trace/request IDs).
* Metrics from FPM status page, DB pool, cache hit ratio.
* Healthchecks that test DB/cache reachability, not just “200 OK”.

### 5. Database ops

* **Persistent connections / pooling** (via PDO `persistent => true` or PgBouncer/proxysql).
* **Timeouts**: always set them (DB, HTTP clients). Don’t let hung sockets stall FPM.
* **Isolation**: know the DB’s default (`READ COMMITTED` vs `REPEATABLE READ`).
* Use retries + idempotency for deadlocks/serialization errors.

### 6. Cache layer

* Redis/Memcached TTL sizing, eviction policy.
* Stampede protection: lock/jitter.
* Watch OOM restarts in Redis.

### 7. Session/storage

* Session handler: Redis/Memcached (not files if you scale horizontally).
* Cookie flags: `Secure`, `HttpOnly`, `SameSite`.
* `session.gc_maxlifetime` vs real-world expectations (idle logout).

### 8. HTTP/edge

* **Headers:** `Cache-Control`, CSP, HSTS.
* **Compression:** enable `gzip`/`brotli` at proxy.
* **TLS:** keep modern ciphers, auto-rotate certs.
* **Static assets:** served by CDN, not PHP.

### 9. Deployment patterns

* **Atomic deploys** (symlink switch, blue/green, or containers).
* Warm up OPcache (hit key URLs after reload).
* Rollback plan (symlink flip or container rollback).
* Zero-downtime reload (`systemctl reload php-fpm` or USR2 signal).

### 10. Scaling knobs

* **Horizontal scale** with load balancer; don’t over-stuff one box.
* Sticky sessions only if unavoidable (better: centralized session store).
* Watch: DB connection limits, Redis latency, file descriptor counts.

---

# Interview sound bites

* *“I always tune OPcache (memory, max files, timestamps) and FPM workers based on DB connections and memory per worker. Those two knobs alone decide whether your PHP app feels snappy or collapses.”*
* *“Atomic deploys plus FPM reload let me safely set `opcache.validate_timestamps=0` for maximum performance.”*
* *“I log via PSR-3 into structured JSON, trace IDs across requests, and expose a `/health` endpoint that hits DB + cache.”*
* *“For scaling, persistent DB pools and Redis for sessions/caching are critical; I keep TTL jitter to prevent cache stampedes.”*

---

Do you want me to wrap all of this into a **production-ready `php.ini` + `php-fpm.conf` snippet with comments** (the “knobs you actually tune”) so you have something concrete to drop in an answer?


