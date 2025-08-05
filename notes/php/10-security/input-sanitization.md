# PHP Security: Input Sanitization

## What is Input Sanitization?

Input sanitization cleans user input to prevent malicious data causing security vulnerabilities, such as SQL Injection, XSS, or command injection.

------

## Common Sanitization Techniques

### 1. Escaping Output

Always escape data when outputting to HTML:

```php
echo htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
```

------

### 2. Filtering Input

Use PHP’s `filter_var` or `filter_input` to validate and sanitize inputs:

```php
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
```

------

### 3. Removing Tags

Strip HTML tags if input should be plain text:

```php
$text = strip_tags($_POST['comment']);
```

------

### 4. Type Casting and Validation

Cast inputs to expected types and validate:

```php
$age = (int) $_GET['age'];
if ($age < 0) {
    // handle invalid input
}
```

------

## Filtering Examples

```php
$url = filter_var($_POST['url'], FILTER_VALIDATE_URL);
if (!$url) {
    echo "Invalid URL";
}
```

------

## Sanitizing Arrays

Sanitize each array element:

```php
$inputs = filter_input(INPUT_POST, 'tags', FILTER_SANITIZE_STRING, FILTER_REQUIRE_ARRAY);
```

------

## Using Prepared Statements (Important!)

Sanitization is not a substitute for prepared statements for SQL queries.

------

## Practical Example: Sanitizing Form Data

```php
$name = htmlspecialchars(trim($_POST['name']), ENT_QUOTES, 'UTF-8');
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Invalid email");
}
```

------

## Best Practices

- Always sanitize input data before processing.
- Escape output depending on context (HTML, SQL, JS).
- Use prepared statements for database queries.
- Validate data types and formats.
- Reject or sanitize unexpected inputs early.

