# PHP Web Development: Sessions and Cookies

## Sessions

### What is a Session?

A session stores user data on the server to persist state across multiple requests.

------

### Starting a Session

```php
session_start();
```

Must be called before any output.

------

### Storing and Retrieving Session Data

```php
$_SESSION['user_id'] = 123;
echo $_SESSION['user_id'];  // 123
```

------

### Destroying a Session

```php
session_start();
session_unset();
session_destroy();
```

------

## Cookies

### What is a Cookie?

A cookie stores data on the client browser to persist state or preferences.

------

### Setting a Cookie

```php
setcookie("username", "alice", time() + 3600, "/");
```

- Parameters: name, value, expiry timestamp, path, domain, secure, httponly

------

### Accessing Cookies

```php
echo $_COOKIE['username'] ?? 'Guest';
```

------

### Deleting a Cookie

```php
setcookie("username", "", time() - 3600, "/");
```

------

## Cookie Security Flags

- **Secure**: cookie sent only over HTTPS.
- **HttpOnly**: inaccessible via JavaScript (helps prevent XSS).
- **SameSite**: controls cross-site sending (Strict, Lax, None).

Example:

```php
setcookie("session", "abc", time()+3600, "/", "", true, true);
```

------

## Practical Example: Login Session

```php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
```

------

## Best Practices

- Always call `session_start()` at script beginning.
- Use secure flags on cookies.
- Regenerate session ID on login to prevent fixation.
- Store minimal sensitive data in sessions.
- Validate and sanitize cookie data.