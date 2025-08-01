# PHP Security: CSRF and XSS

## Cross-Site Request Forgery (CSRF)

### What is CSRF?

CSRF tricks authenticated users into submitting unwanted requests to a web application.

------

### Preventing CSRF

- Use **CSRF tokens** in forms.

Laravel example:

```blade
<form method="POST" action="/submit">
    @csrf
    <!-- form fields -->
</form>
```

- Verify token server-side.

PHP manual example:

```php
if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    die('Invalid CSRF token');
}
```

------

## Cross-Site Scripting (XSS)

### What is XSS?

XSS allows attackers to inject malicious scripts into web pages viewed by others.

------

### Preventing XSS

- Escape output with `htmlspecialchars()`:

```php
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');
```

- Use frameworks’ built-in escaping (e.g., Blade auto-escapes).
- Sanitize inputs, but escaping output is most important.

------

## Content Security Policy (CSP)

Use CSP headers to restrict script execution.

```php
header("Content-Security-Policy: default-src 'self'");
```

------

## Practical Example: Secure Form Output

```php
// Display user comment safely
echo htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');
```

------

## Best Practices

- Always validate and sanitize user input.
- Escape all output based on context (HTML, JS, URLs).
- Use CSRF tokens on all state-changing requests.
- Implement Content Security Policy headers.
- Keep libraries and frameworks updated.