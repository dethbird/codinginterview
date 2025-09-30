# Why you’d prefer DateTimeImmutable over DateTime.

Great place to start—this one comes up a lot because it looks deceptively small but is really about **safety and code design**.

### The core difference

* `DateTime` is **mutable**. If you call `$d->modify('+1 day')`, the *same* object changes. Any variable that references it now has a different date.
* `DateTimeImmutable` is **immutable**. `$d->modify('+1 day')` returns a *new* object, leaving the original untouched.

### Why immutability is safer

1. **No spooky action at a distance**
   If you pass a `DateTime` into a function, that function can mutate it and suddenly your caller’s variable is different. With `DateTimeImmutable`, the function can’t accidentally (or maliciously) change the caller’s state.

2. **Predictability in shared references**
   Example:

   ```php
   $a = new DateTime('2025-01-01');
   $b = $a;
   $b->modify('+1 day');
   echo $a->format('Y-m-d'); // surprise: 2025-01-02
   ```

   With `DateTimeImmutable`, `$a` would still be `2025-01-01`.

3. **Functional style and testability**
   Immutables line up with modern best practices: pure functions (no side effects), safer concurrency, easier debugging, fewer hidden dependencies.

4. **Industry precedent**
   Almost every modern language prefers immutables for “value-like” types: Java’s `LocalDate`, Python’s `datetime`, JavaScript’s new `Temporal` API. PHP was late to the party, but `DateTimeImmutable` closes the gap.

### When to use which

* **Default**: always `DateTimeImmutable`.
* **Legacy code**: you might be stuck with `DateTime` because of old APIs or frameworks. In new code, it’s considered best practice to avoid it.

### How to answer in an interview

Something short and confident, like:

> I prefer `DateTimeImmutable` because it prevents unexpected side effects. With mutable `DateTime`, changing one reference can silently change others. Immutability makes code safer, easier to reason about, and aligns with modern best practices.

Would you like me to also show you a **small snippet you could type on the spot** to illustrate the pitfall (like the `$a`/`$b` example above), in case you want to have a demo in your back pocket?


# Why password_hash is better than writing your own hashing.

This one is a security landmine question—the interviewer isn’t testing if you know SHA-256 syntax, they’re checking whether you understand *why rolling your own crypto is bad*.

### Why `password_hash()` is better

1. **Built-in, vetted algorithms**

   * `password_hash()` uses **bcrypt** or **argon2** (depending on PHP version).
   * Both are specifically designed for passwords: they’re *slow* and can be tuned (cost factor / memory cost).
   * SHA-256, MD5, or similar cryptographic hashes are fast, which makes brute-forcing trivial on GPUs/ASICs.

2. **Automatic salt handling**

   * When you call `password_hash()`, PHP generates a cryptographically secure random salt and stores it inside the hash string.
   * If you “roll your own,” you must remember to salt every password correctly, store the salt safely, and handle uniqueness per user. Most homegrown schemes mess this up.

3. **Upgrade path**

   * The function encodes algorithm + cost parameters into the returned hash.
   * `password_needs_rehash()` lets you transparently migrate old hashes when better algorithms or cost factors become available.
   * If you wrote your own scheme, you’d have to build and maintain this migration logic.

4. **Security audits & best practice**

   * `password_hash()` is part of the core language, widely reviewed, battle-tested.
   * Your own code isn’t. One bug in how you handle salts, encodings, or timing leaks could sink the whole system.

### Example

```php
$hash = password_hash($plaintext, PASSWORD_DEFAULT);
if (password_verify($plaintext, $hash)) {
    echo "ok";
}
```

* `$hash` includes algorithm, cost, and salt: `$2y$10$D9vuHj…`
* No need to store a separate salt field.

### How to phrase it in an interview

> I would never write my own hashing because `password_hash()` handles salts, algorithm choice, and upgrade paths automatically, and it uses algorithms tuned for password security like bcrypt or argon2. A homegrown SHA-256 + salt scheme is fast to brute-force and error-prone to maintain.

---

Want me to also cover the **“what if I need to migrate old unsalted MD5 hashes?”** angle? That sometimes gets asked as a follow-up.

# What OPcache does and how you’d deploy with it.

Here’s the crisp, interview-ready version.

### What OPcache does (in one breath)

OPcache is PHP’s built-in bytecode cache. It compiles your `.php` files once to opcodes and stores them in shared memory so subsequent requests skip parsing/compilation. Result: lower CPU, faster TTFB, fewer syscalls. It also interns strings and can **preload** code at FPM startup.

### Why it matters

* PHP is request-based; without OPcache you re-parse/re-compile on every hit.
* With OPcache, hot paths are already compiled; you mostly pay execution time + I/O.
* JIT (optional) can help CPU-bound loops, but typical web apps are I/O-bound, so OPcache is the main win.

### Key ini settings you actually tune

```ini
; turn it on (FPM/Apache)
opcache.enable=1

; allocate enough shared memory for bytecode (measure your code size; start 128–256M)
opcache.memory_consumption=256

; number of script entries (set > number of distinct PHP files; e.g., 20–40k)
opcache.max_accelerated_files=40000

; interned strings buffer (helps frameworks with many identical strings)
opcache.interned_strings_buffer=16

; safer deployments:
;  - If you have a controlled deploy (blue/green, atomic symlink), set to 0 for max perf,
;    but you MUST reload FPM on deploy.
;  - Otherwise keep timestamps enabled with a short revalidate freq.
opcache.validate_timestamps=0
; opcache.revalidate_freq=2   ; (only used if validate_timestamps=1)

; optional: keep a disk mirror of cached bytecode for faster warm starts (containers)
; opcache.file_cache=/tmp/opcache

; CLI/long-running workers (queues, daemons) only if they benefit:
; opcache.enable_cli=1
```

### Preloading (7.4+)

* `opcache.preload=/var/www/app/preload.php`
* That file should `require` (or `opcache_compile_file`) your hottest classes/functions so they’re compiled and **kept in memory** when PHP-FPM master starts.
* Good for frameworks (routing tables, ORM metadata). Requires consistent paths and same SAPI on all nodes.

### Deploy strategy that won’t bite you

1. **Blue/green or atomic symlink release**

   * Build to `/releases/2025-09-30_1200`, then atomically switch `/var/www/app -> /releases/...`.
2. **Set `opcache.validate_timestamps=0` for max perf**

   * On deploy, **gracefully reload** PHP-FPM (or Apache) to flush OPcache:

     * `systemctl reload php-fpm` (or `kill -USR2 <master_pid>`), or call `opcache_reset()` behind an authenticated admin endpoint (reload is cleaner).
3. **Warm the cache**

   * Hit a small set of warm-up URLs, or run a CLI script that calls `opcache_compile_file()` for critical code paths to avoid cold-start latency spikes.
4. **Observe & size**

   * Expose a tiny status endpoint that dumps `opcache_get_status()`; watch:

     * `memory_usage` vs `memory_consumption` (don’t run out)
     * `num_cached_scripts` vs `max_accelerated_files` (increase if near cap)
     * `restart_pending`/`oom_restarts` (bad—raise memory)

### Common pitfalls (mention these and you sound seasoned)

* **“It’s enabled but I see no speedup”** → `opcache.max_accelerated_files` too low or memory too small → constant evictions.
* **NFS/network FS** → inconsistent mtimes can cause invalidation weirdness; prefer local disks per release and atomic swaps.
* **Forgetting to reload** with `validate_timestamps=0` → serving old code forever.
* **`enable_cli=1` everywhere** → wastes memory for short-lived CLI commands; only enable if you have long-running CLI workers that benefit.

### JIT quick note (so you don’t overclaim)

Enable only after benchmarking CPU-heavy workloads (image processing, numeric loops). It rarely helps classic MVC web requests; OPcache itself is the big win.

If you want, next we can sketch a one-file **OPcache status page** you can drop into any server to practice reading real metrics, or we can move to your next interview question.

# JIT (Just in time compiling)

Yes, this is a good one because it sounds scary and deep, but the key is knowing how **PHP’s execution model** works and why JIT usually doesn’t matter in day-to-day web code.

---

### What JIT is in PHP

* PHP normally runs in the **Zend Engine**, which parses your code → compiles to **opcodes** → interprets those at runtime.
* **OPcache** caches those opcodes in memory.
* **JIT (Just-In-Time compilation)**, added in PHP 8.0, takes those opcodes and compiles some of them down to **native machine code** at runtime.
* That means CPU-bound code can skip the interpreter and run faster, closer to C speed.

---

### Where JIT actually helps

* **Numeric & scientific workloads**: fractals, FFTs, matrix multiplications, simulations, cryptography, compression.
* **Long-running worker processes**: e.g. a daemon doing image analysis, or an ML library ported to PHP.
* **Benchmarks**: synthetic loops run faster because they’re exactly the kind of hot, CPU-bound code JIT optimizes.

---

### Where JIT does *not* help much

* **Typical web requests**: database queries, network calls, rendering templates. Those are I/O-bound, not CPU-bound. Shaving a few nanoseconds off a loop doesn’t matter when you’re waiting 10 ms on MySQL.
* **Framework apps**: lots of branching, string handling, and I/O. Those don’t see big wins.
* **Short-lived processes**: CLI scripts that run and exit may not even “warm up” enough for JIT to kick in.

---

### Why you’d use it (and why not)

* You’d enable JIT **only if you benchmark your workload and see gains**. For example, PHP doing geometry calculations in a gaming backend.
* It does increase **memory usage** and complexity. If you don’t need it, you just enable OPcache without JIT and you get almost all the benefit for web apps.

---

### How to configure (interview-friendly snippet)

```ini
opcache.enable=1
opcache.jit_buffer_size=128M
opcache.jit=tracing
```

* `jit_buffer_size=0` disables it.
* Modes: *function*, *tracing* (aggressiveness levels).
* Tracing JIT can inline across functions and loops, best for numeric code.

---

### How to answer in an interview

> PHP’s JIT compiles hot opcodes down to native machine code at runtime. It can speed up CPU-heavy loops like math or image processing. But for normal web apps, which are I/O-bound, you don’t see big gains—OPcache already gives the big performance jump. So I’d enable JIT only after benchmarking workloads that are CPU-bound and long-running.

---

Want me to also give you a **tiny code demo** (a loop or Mandelbrot) that shows the difference between JIT on and off? That’s sometimes a fun thing to have in your pocket.


# How strict typing improves codebases (and how you’d migrate old PHP 5/7 code).

Here’s the tight, interview-ready take—with a practical migration playbook you can actually run.

# Why strict typing improves codebases

**What “strict” means in PHP:**
`declare(strict_types=1);` at the top of a file tells PHP to **throw `TypeError`** on bad scalar arguments/returns instead of silently coercing (e.g., `"42dogs"` → 42). It applies to **userland** function calls defined in that file.

**Benefits you can state clearly:**

1. **Bugs become visible at the call site**
   Coercion hides mistakes. Strict types surface them immediately.

   ```php
   // without strict: this silently becomes 42
   function add(int $a, int $b): int { return $a + $b; }
   add("42dogs", 0); // coercion vs. TypeError with strict
   ```

2. **Self-documenting APIs**
   Param/return/property types (and `readonly`/enums) encode intent. Less guessing, fewer comments.

3. **Refactor safety**
   The engine + static analysis catch misuse as you move code. Easier large-scale changes.

4. **Tooling superpowers**
   PHPStan/Psalm become far more effective (dead code, impossible branches, wrong array shapes, etc.).

5. **Security & correctness**
   Fewer “surprise” truthiness/loose-compare bugs; consistent data at boundaries.

# What to type in modern PHP (8.1/8.2+ highlights)

* **Scalar & class types** everywhere (params, returns, properties).
* **`?T` and union types**: `int|float`, `string|null`.
* **`never`, `true`, `false`, `mixed`, `static`** when applicable.
* **`DateTimeImmutable`, `enum`, value objects, DTOs** for stronger domain modeling.
* Prefer **immutability** (`readonly` properties/classes) for predictability.

# Migration plan: old PHP 5/7 → modern typed code

Think **incremental, safe, measurable**. You don’t “flip a switch”; you ratchet up strictness over time.

**0) Preconditions**

* Bump runtime to a supported PHP (8.2/8.3).
* Adopt **PSR-4 autoloading** (Composer) and a formatter (PHP-CS-Fixer).
* Add/solidify **tests** (unit + a few happy-path integration tests).

**1) Introduce static analysis at Level you can pass**

* Add **PHPStan or Psalm** at a permissive level (PHPStan lvl 3 / Psalm baseline).
* Enable on CI; treat findings as a backlog. Raise the level over time.

**2) Turn on strict types gradually**

* Start with leaf modules (utility libraries) and new files:

  ```php
  <?php declare(strict_types=1);
  ```
* Don’t mass-apply to legacy hotspots yet—avoid breaking wide surfaces in one go.

**3) Add types at the boundaries first**

* **Controllers/CLI entrypoints**: validate/normalize inputs (from HTTP/JSON/ENV) to typed DTOs.
* **Repository & service interfaces**: add param/return types where callers are few.
* Keep adapters thin so you don’t chase types through the whole app at once.

**4) Tame arrays**

* Replace “bag of arrays” with **DTOs** (small classes) for important shapes.
* Where arrays remain, use docblocks with array-shapes for analyzers:

  ```php
  /** @param array{title:string, artist:string, duration:int} $track */
  function play(array $track): void {}
  ```

  Then later promote to a real class.

**5) Add property types & immutability**

* Convert dynamic props to **declared** props (8.2 deprecates dynamic ones).
* Use `readonly` for IDs, created-at, config.

**6) Enforce returns**

* Add return types last on functions with many callers to minimize ripples.
* Where you truly can’t decide a type yet, use `mixed` as a temporary quarantine—then remove it later.

**7) Tighten CI**

* Fail PRs if typed files call untyped functions incorrectly.
* Ratchet static analysis level up by 1 each sprint.
* Add Rector to automate easy wins (param/return typing, nullable to union, etc.).

**8) Roll strict_types wider**

* Once coverage is good and hotspots are typed, enable `strict_types` project-wide.
* Keep a small allowlist of legacy files without it until they’re refactored.

# Concrete examples you can speak to

**Before (typical PHP 5/7 style):**

```php
function moneyFormat($amount, $currency = 'USD') {
    return number_format($amount, 2) . " $currency";
}
echo moneyFormat("7.5dogs"); // "7.50 USD" – yikes
```

**After (typed, strict, safer):**

```php
<?php declare(strict_types=1);

function moneyFormat(float $amount, string $currency = 'USD'): string {
    return number_format($amount, 2, '.', '') . " $currency";
}
moneyFormat(7.5, 'USD');         // ok
moneyFormat("7.5dogs");          // TypeError at call site (good)
```

**DTO + immutability:**

```php
final class Money {
    public function __construct(
        public readonly int $cents,
        public readonly string $currency
    ) {}
}
// Avoids float rounding bugs; explicit currency.
```

# Smart interview sound bites

* *“I migrate by typing the edges first (controllers/adapters), introduce DTOs instead of raw arrays, and enable `strict_types` file-by-file. Static analysis runs in CI from day one; we ratchet its level each sprint.”*
* *“Strict typing turns hidden coercion bugs into immediate `TypeError`s. Combined with PHPStan/Psalm and `readonly`/enums, refactors become safe and mechanical.”*
* *“For legacy, I won’t block delivery: I create a typed façade over untyped internals, then steadily shrink the untyped core.”*

If you want, give me a small snippet of your legacy code, and I’ll show a **surgical refactor**: add a typed interface + adapter, DTOs, a couple of unit tests, then flip `strict_types` without breaking callers.
