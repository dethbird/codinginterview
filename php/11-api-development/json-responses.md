# PHP API Development: JSON Responses

## What are JSON Responses?

JSON responses send data from server to client in JSON format, widely used in REST APIs.

------

## Sending JSON Response in PHP

Set header and encode data:

```php
header('Content-Type: application/json');
echo json_encode($data);
```

------

## Encoding Options

- `JSON_PRETTY_PRINT` for readable output (dev only).
- `JSON_UNESCAPED_UNICODE` for Unicode characters.
- `JSON_UNESCAPED_SLASHES` to avoid escaping slashes.

Example:

```php
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
```

------

## Handling Errors in JSON APIs

Return error messages with proper status code:

```php
http_response_code(400);
echo json_encode(['error' => 'Invalid input']);
```

------

## Using JSON Responses with Laravel

Return JSON with `response()->json()`:

```php
return response()->json(['name' => 'Alice']);
```

------

## Practical Example: JSON API Endpoint

```php
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $users = getUsers();
    header('Content-Type: application/json');
    echo json_encode($users);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
```

------

## Best Practices

- Always set `Content-Type: application/json`.
- Handle encoding errors using `json_last_error()`.
- Structure JSON responses consistently.
- Avoid leaking sensitive data in errors.

