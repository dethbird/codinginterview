Onward to `strings.md`! Here’s the detailed, interview-friendly notes for PHP strings, ready for you to add to your markdown:

------

# PHP Strings

## What is a String in PHP?

A string is a sequence of characters used to store text data. PHP strings are mutable and can be declared with single quotes `'...'` or double quotes `"..."`.

------

## Single vs Double Quotes

- **Single quotes**: Treat content literally, no variable interpolation or escape sequences except `\\` and `\'`.

  ```php
  $name = 'Alice';
  echo 'Hello $name\n';  // outputs: Hello $name\n
  ```

- **Double quotes**: Allow variable interpolation and special escape sequences (`\n`, `\t`, etc).

  ```php
  $name = "Alice";
  echo "Hello $name\n";  // outputs: Hello Alice (newline)
  ```

------

## Concatenation

Use the dot `.` operator to concatenate strings.

```php
$greeting = "Hello, " . $name . "!";
echo $greeting; // Hello, Alice!
```

------

## Common String Functions

- `strlen($str)`: Returns length of the string.
- `strpos($haystack, $needle)`: Finds position of first occurrence of `$needle`.
- `str_replace($search, $replace, $subject)`: Replaces all occurrences.
- `substr($str, $start, $length)`: Extracts substring.
- `trim($str)`: Removes whitespace from both ends.
- `strtoupper($str)`: Converts to uppercase.
- `strtolower($str)`: Converts to lowercase.
- `explode($delimiter, $string)`: Splits string into array.
- `implode($delimiter, $array)`: Joins array into string.

**Examples:**

```php
$text = "  Hello World  ";

echo strlen($text);             // 13 (includes spaces)
echo trim($text);               // "Hello World"
echo strtoupper($text);         // "  HELLO WORLD  "
echo strpos($text, "World");    // 8

$parts = explode(" ", $text);
print_r($parts);                // ["", "", "Hello", "World", "", ""]

$joined = implode("-", $parts);
echo $joined;                   // "--Hello-World--"
```

------

## Variable Interpolation with Curly Braces

Use curly braces to clearly delimit variables inside double-quoted strings.

```php
$name = "Alice";
echo "Hello {$name}s!";  // outputs: Hello Alices!
```

------

## Heredoc and Nowdoc Syntax

Useful for multiline strings.

- **Heredoc**: acts like double quotes (supports interpolation).

```php
$str = <<<EOD
Hello, $name!
Welcome to PHP strings.
EOD;
```

- **Nowdoc**: acts like single quotes (no interpolation).

```php
$str = <<<'EOD'
Hello, $name!
This is a nowdoc string.
EOD;
```

------

## Escape Sequences in Double-Quoted Strings

| Escape | Description     |
| ------ | --------------- |
| `\n`   | Newline         |
| `\r`   | Carriage return |
| `\t`   | Tab             |
| `\\`   | Backslash       |
| `\$`   | Dollar sign     |
| `\"`   | Double quote    |

------

## Multibyte Strings (UTF-8)

For Unicode strings, use PHP’s `mb_*` functions to handle multibyte characters properly.

Example:

```php
$unicode = "😊";
echo strlen($unicode);         // might be >1, depending on encoding
echo mb_strlen($unicode);      // correctly returns 1
```

------

## Practical Example: Formatting a Name

```php
$rawName = "  alice smith  ";
$cleanName = trim($rawName);
$cleanName = ucwords(strtolower($cleanName));
echo "Hello, $cleanName!"; // Hello, Alice Smith!
```

------

## Best Practices

- Use double quotes when you need interpolation or escape sequences.
- Use single quotes when string is literal (better performance).
- Use `mb_*` string functions for internationalization support.
- Avoid concatenation inside loops; prefer building strings efficiently.

------

Let me know when you’re ready for `loops-conditionals.md` or want to review anything here!