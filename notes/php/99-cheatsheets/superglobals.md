# PHP Cheatsheet: Superglobals

## What Are Superglobals?

Superglobals are built-in PHP variables accessible from any scope without `global` keyword.

------

## Common Superglobals

| Variable    | Description                           |
| ----------- | ------------------------------------- |
| `$_GET`     | HTTP GET variables (URL parameters)   |
| `$_POST`    | HTTP POST variables (form data)       |
| `$_REQUEST` | Combination of GET, POST, COOKIE      |
| `$_SERVER`  | Server and execution environment info |
| `$_SESSION` | Session variables                     |
| `$_COOKIE`  | HTTP cookies                          |
| `$_FILES`   | Uploaded file information             |
| `$_ENV`     | Environment variables                 |
| `$GLOBALS`  | All global variables                  |

------

## Usage Examples

### Accessing Query Parameters

```php
$name = $_GET['name'] ?? 'Guest';
```

------

### Accessing Form Data

```php
$email = $_POST['email'] ?? '';
```

------

### Accessing Server Info

```php
$host = $_SERVER['HTTP_HOST'];
$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
```

------

### Working with Sessions

```php
session_start();
$_SESSION['user_id'] = 123;
```

------

### Handling File Uploads

```php
if (isset($_FILES['file'])) {
    $tmpName = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
}
```

------

## Notes

- Use `$_REQUEST` with caution; it merges multiple sources.
- Superglobals are always available but can be modified.
- Sanitize all input from `$_GET`, `$_POST`, and `$_COOKIE`.

