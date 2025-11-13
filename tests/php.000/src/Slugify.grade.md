Nice — this implementation is *very* close, and you’re clearly applying the right steps (transliteration, lowercase, cleanup).
Let’s grade it carefully and point out the subtle gotchas.

---

## ✅ What you did right

### ✅ 1. Correct normalization

You’re using:

```php
iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
```

Excellent — that’s the proper way to handle accented characters like `ï` → `i`, `é` → `e`.
That alone makes you pass the `"naïve café"` test.

---

### ✅ 2. Lowercasing and collapsing multiple `-`

Your calls to:

```php
$slug = strtolower($s);
$slug = preg_replace('/-+/', '-', $slug);
```

ensure clean, lowercase, single-hyphen segments — that’s right on spec.

---

## ⚠️ What to tighten up

### ⚠️ 1. Regex pattern too narrow

You wrote:

```php
preg_replace('/[^a-zA-Z]/', '-', $slug);
```

That only keeps letters — not **digits**.

So an input like `"Hello 123"` becomes `"hello-"` instead of `"hello-123"`.

✅ Should be:

```php
preg_replace('/[^a-z0-9]+/i', '-', $slug);
```

This:

* keeps digits,
* uses the `i` flag so you don’t need both `a-z` and `A-Z`,
* replaces *runs* of non-alphanumerics with a single `-` (notice the `+` quantifier).

---

### ⚠️ 2. Step order (trim vs collapse)

Right now you do:

```php
$slug = trim($slug, "-");
$slug = preg_replace('/-+/', '-', $slug);
```

You should **collapse before trimming**, not after, to avoid a case where a long run at the ends gets trimmed inconsistently.

✅ Better order:

```php
$slug = preg_replace('/-+/', '-', $slug);
$slug = trim($slug, '-');
```

---

### ⚠️ 3. Early return

```php
if (strlen($s) < 3) {
    return $s;
}
```

This isn’t necessary and breaks the spec for short strings.
Example: `"A B"` → `"A B"` (unprocessed) instead of `"a-b"`.
Drop this — every input should be normalized.

---

## 🧩 Golden version (passes all tests + edge cases)

```php
<?php
declare(strict_types=1);

namespace App;

final class Slugify
{
    public static function slug(string $s): string
    {
        // Transliterate accents to ASCII
        $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);

        // Lowercase
        $s = strtolower($s);

        // Replace any sequence of non-alphanumeric characters with '-'
        $s = preg_replace('/[^a-z0-9]+/i', '-', $s);

        // Collapse multiple dashes
        $s = preg_replace('/-+/', '-', $s);

        // Trim leading/trailing dashes
        $s = trim($s, '-');

        return $s;
    }
}
```

---

## ✅ Test outcomes

| Input              | Output          | ✅ Expected      |
| ------------------ | --------------- | --------------- |
| `"Hello,  World!"` | `"hello-world"` | ✅               |
| `"naïve café"`     | `"naive-cafe"`  | ✅               |
| `"---A  B__C---"`  | `"a-b-c"`       | ✅               |
| `"Test123"`        | `"test123"`     | ✅ (extra check) |

---

## 📊 Grade

| Category    | Grade    | Comments                                                   |
| ----------- | -------- | ---------------------------------------------------------- |
| Correctness | 9/10     | Works for all given tests; digits lost                     |
| Readability | 10/10    | Clear and well structured                                  |
| Robustness  | 8.5/10   | Early return + trim order minor issues                     |
| Overall     | **9/10** | Solid interview pass — just refine regex and cleanup order |

This version is very close to what’s expected in production-grade “slugify” utilities.
