# PHP Web Development: Headers and Redirects

## Sending HTTP Headers

Use `header()` function to send raw HTTP headers before any output.

```php
header('Content-Type: application/json');
```

Common headers:

- `Content-Type`: defines the media type (e.g., `text/html`, `application/json`)
- `Cache-Control`: caching policies
- `Location`: redirects to another URL

------

## Redirecting with Headers

Use the `Location` header to redirect the client.

```php
header('Location: /login.php');
exit;
```

- Always call `exit` or `die` after redirect to prevent further script execution.

------

## Setting Status Codes with Headers

You can set status codes with:

```php
http_response_code(404);
```

Or by sending a status header explicitly:

```php
header("HTTP/1.1 404 Not Found");
```

------

## Common HTTP Status Codes

| Code | Meaning                    |
| ---- | -------------------------- |
| 200  | OK                         |
| 301  | Moved Permanently          |
| 302  | Found (Temporary Redirect) |
| 400  | Bad Request                |
| 401  | Unauthorized               |
| 403  | Forbidden                  |
| 404  | Not Found                  |
| 500  | Internal Server Error      |

------

## Multiple Headers

You can send multiple headers before output:

```php
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
```

------

## Practical Example: Redirect after Form Submission

```php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Process form data...

    header('Location: thankyou.php');
    exit;
}
```

------

## Best Practices

- Send headers before any output (no whitespace or echo before `header()`).
- Use `exit` immediately after redirects.
- Set appropriate status codes for error handling.
- Use headers to control caching behavior.

