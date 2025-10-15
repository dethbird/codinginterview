Since you’re interviewing at Meta, the flavor of PHP is actually a little unusual: Meta doesn’t run vanilla PHP 8.x in production—they use HHVM (HipHop Virtual Machine) and their own dialect called Hack. So you’re not going to get grilled on “what changed in PHP 8.2 vs 8.1” trivia.

Instead, they’ll test your core engineering chops in a PHP-ish syntax, with emphasis on:

Strong problem-solving (algorithms, data structures, correctness, efficiency).

System design (service boundaries, scaling, caching, fault tolerance).

Clean, testable code (OOP design, typing, immutability, DI patterns).

API ergonomics (especially GraphQL schema/resolver design).

Practical safety/security (memory use, null handling, type safety, SQL injection, etc.).

That said, interviewers sometimes use version-specific questions as proxies for “do you keep up with the ecosystem” or “do you understand modern best practices.”
So you probably won’t get a direct “what did 8.1 add?” but you could absolutely be asked:

Why you’d prefer DateTimeImmutable over DateTime.

Why password_hash is better than writing your own hashing.

What OPcache does and how you’d deploy with it.

How strict typing improves codebases (and how you’d migrate old PHP 5/7 code).

In short:

Meta’s bar: correctness, clarity, scaling, code quality.

Version knowledge: useful garnish, not the entrée. If you demonstrate you can solve problems cleanly with modern constructs (typed properties, exceptions, immutable patterns, DI), you’ll be in good shape.

If you’ve been away since PHP 3 and are brushing up, the safest prep is:

Work in strict mode: declare(strict_types=1); at the top of every file.

Use type hints everywhere (params, return, properties).

Lean on immutability and small classes/functions.

Write PHPUnit/Pest tests as you go.

Would you like me to put together a Meta-style mock interview in PHP, with one data structure/algorithm problem, one GraphQL schema design prompt, and one “debug/fix this broken code” challenge? That’d give you the flavor of what you’re likely to face.