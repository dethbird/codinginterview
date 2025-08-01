# PHP API Development: Headers and Status Codes

## HTTP Headers

Headers carry metadata for requests and responses, such as content type, authentication, caching, etc.

------

## Setting Response Headers in PHP

Use `header()` function:

```php
header('Content-Type: application/json');
header('Cache-Control: no-cache');
```

------

## Common Response Headers

- `Content-Type`: type of returned content (`application/json`, `text/html`, etc.)
- `Authorization`: for bearer tokens or basic auth
- `Cache-Control`: controls caching behavior
- `Access-Control-Allow-Origin`: CORS policy

------

## HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 405  | Method Not Allowed    |
| 500  | Internal Server Error |

------

## Setting Status Codes in PHP

```php
http_response_code(404);
```

Or

```php
header("HTTP/1.1 404 Not Found");
```

------

## CORS Headers for APIs

To allow cross-origin requests:

```php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
```

------

## Practical Example: JSON API Response with Status

```php
http_response_code(201);
header('Content-Type: application/json');

echo json_encode(['message' => 'Resource created']);
```

------

## Best Practices

- Always set appropriate `Content-Type`.
- Use correct HTTP status codes.
- Add CORS headers when building public APIs.
- Avoid sending output before setting headers/status.

