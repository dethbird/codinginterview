# PHP Web Development: Request and Response

## HTTP Request

### What is an HTTP Request?

An HTTP request is a message sent by a client (usually a browser) to a server asking for a resource.

------

### Common Request Methods

- **GET**: Retrieve data.
- **POST**: Send data to the server.
- **PUT**: Update data.
- **DELETE**: Delete data.
- **PATCH**: Partial update.

------

### Accessing Request Data in PHP

- `$_GET` — query string parameters (for GET requests).
- `$_POST` — form data (for POST requests).
- `$_REQUEST` — combined GET, POST, COOKIE.
- `php://input` — raw body (for JSON or XML payloads).
- `$_SERVER` — server and request info.

Example:

```php
$name = $_GET['name'] ?? 'Guest';
```

------

### Headers

Use `getallheaders()` to get HTTP headers (Apache only, alternative for others below):

```php
$headers = getallheaders();
$userAgent = $headers['User-Agent'] ?? '';
```

Or use `$_SERVER`:

```php
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
```

------

## HTTP Response

### What is an HTTP Response?

The message sent back from the server to the client, containing status, headers, and content.

------

### Sending Headers in PHP

```php
header('Content-Type: application/json');
header('Cache-Control: no-cache');
```

------

### Sending Status Codes

```php
http_response_code(404);
```

------

### Outputting Content

```php
echo json_encode(['message' => 'Not found']);
```

------

### Redirecting

```php
header('Location: /login.php');
exit;
```

------

## Practical Example: Simple API Endpoint

```php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    // process $data
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(405);
    echo "Method Not Allowed";
}
```

------

## Best Practices

- Validate request methods and data.
- Always send appropriate status codes.
- Sanitize inputs to prevent security issues.
- Use consistent content-type headers.
- Call `exit` or `die` after redirects.

