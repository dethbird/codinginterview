# PHP Interview Practice

Time-boxed PHP challenges with **PHPUnit**. Each challenge has a stub in `src/` with `// TODO` markers and a failing test in `tests/`. Implement the functions/classes until tests pass.

## Quickstart

```bash
composer install
composer test
# run one test file
cp tests/01-AnagramTest.php tests/AnagramTest.php
vendor/bin/phpunit tests/AnagramTest.php
# run by filter
vendor/bin/phpunit --filter testIgnoresCaseAndSpaces
```

## Challenges
1. **Anagram** — normalize and compare strings.
2. **TwoSum** — indices of two numbers summing to target (O(n)).
3. **BalancedBrackets** — validator for (), {}, [].
4. **RomanNumerals** — convert to integer.
5. **LRUCache** — fixed-capacity key/value with eviction.
6. **Slugify** — make URL slug from string.
7. **LinkedList** — reverse a singly linked list.
8. **TopKFrequent** — find k most frequent elements.
