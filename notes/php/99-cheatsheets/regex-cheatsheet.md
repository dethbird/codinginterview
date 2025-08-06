# PHP Regex Cheatsheet

## Basic Delimiters

- Use `/pattern/` for regex patterns.
- Modifiers follow closing delimiter, e.g. `/pattern/i` for case-insensitive.

------

## Common Regex Syntax

| Pattern       | Meaning                       | Example                         |
| ------------- | ----------------------------- | ------------------------------- |
| `.`           | Any character except newline  | `/a.c/` matches "abc", "a9c"    |
| `\d`          | Digit `[0-9]`                 | `/\d+/` matches "123"           |
| `\D`          | Non-digit                     | `/\D/`                          |
| `\w`          | Word character `[a-zA-Z0-9_]` | `/\w+/`                         |
| `\W`          | Non-word character            | `/\W/`                          |
| `\s`          | Whitespace                    | `/\s/`                          |
| `\S`          | Non-whitespace                | `/\S/`                          |
| `^`           | Start of string               | `/^Hello/`                      |
| `$`           | End of string                 | `/world$/`                      |
| `[...]`       | Character class               | `/[aeiou]/` matches vowels      |
| `[^...]`      | Negated character class       | `/[^aeiou]/` matches non-vowels |
| `*`           | 0 or more repetitions         | `/a*/`                          |
| `+`           | 1 or more repetitions         | `/a+/`                          |
| `?`           | 0 or 1 occurrence (optional)  | `/a?/`                          |
| `{n}`         | Exactly n repetitions         | `/a{3}/` matches "aaa"          |
| `{n,}`        | At least n repetitions        | `/a{2,}/`                       |
| `{n,m}`       | Between n and m repetitions   | `/a{2,4}/`                      |
| `(pattern)`   | Capture group                 | `/a(bc)d/`                      |
| `(?:pattern)` | Non-capturing group           | `/(?:abc)/`                     |
| `\`           | Escape special character      | `/\./` matches literal dot      |

------

## Common Functions in PHP

- `preg_match($pattern, $subject, $matches)` — checks for match, stores matches.
- `preg_match_all($pattern, $subject, $matches)` — all matches.
- `preg_replace($pattern, $replacement, $subject)` — replace with regex.
- `preg_split($pattern, $subject)` — splits string by pattern.

------

## Example: Validate Email (simplified)

```php
$emailPattern = '/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,6}$/';
if (preg_match($emailPattern, $email)) {
    echo "Valid email";
}
```

------

## Anchors

- `^` — Start of string
- `$` — End of string
- `\b` — Word boundary
- `\B` — Not a word boundary

------

## Quantifiers Greedy vs Lazy

- Greedy: `.*` matches as much as possible
- Lazy: `.*?` matches as little as possible

------

## Practical Example: Extract URLs

```php
$pattern = '/https?:\/\/[^\s"]+/i';
preg_match_all($pattern, $text, $matches);
print_r($matches[0]);
```

------

## Best Practices

- Always delimit patterns with `/` or other delimiters.
- Escape user input when inserting into patterns.
- Test regex with online tools like regex101.
- Use anchors to avoid partial matches when needed.
- Prefer named capture groups in PHP 7.3+ for clarity: `(?P<name>pattern)`

