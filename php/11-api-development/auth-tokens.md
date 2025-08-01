# PHP API Development: Authentication Tokens

## What are Auth Tokens?

Authentication tokens are credentials (often JWTs or API keys) used to verify identity without sending passwords on every request.

------

## Common Token Types

- **JWT (JSON Web Token):** Self-contained token with claims, signed to prevent tampering.
- **API Keys:** Simple tokens issued to clients.
- **Bearer Tokens:** Used in Authorization headers.

------

## Using JWT in PHP

### Generating JWT (using a library like firebase/php-jwt)

```php
use \Firebase\JWT\JWT;

$key = "secret_key";
$payload = [
    'iss' => 'your-domain.com',
    'iat' => time(),
    'exp' => time() + 3600,
    'user_id' => 123
];

$jwt = JWT::encode($payload, $key);
```

### Verifying JWT

```php
try {
    $decoded = JWT::decode($jwt, $key, ['HS256']);
    // $decoded contains payload data
} catch (Exception $e) {
    // Invalid token
}
```

------

## Sending Tokens in Requests

Use the `Authorization` header:

```
Authorization: Bearer <token>
```

------

## Validating Tokens in API

Check for token presence and validity on each request before processing.

------

## Practical Example: Extract Token and Verify

```php
$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    list($type, $token) = explode(" ", $headers['Authorization'], 2);
    if ($type === 'Bearer' && $token) {
        // verify token here
    }
}
```

------

## Best Practices

- Use HTTPS to protect tokens in transit.
- Use short-lived tokens with refresh mechanisms.
- Store secrets securely (never hardcode).
- Validate tokens on every request.
- Revoke tokens on logout or compromise.

