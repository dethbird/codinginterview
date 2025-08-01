# PHP Security: Password Hashing

## Why Hash Passwords?

Passwords should never be stored in plain text to protect user data if the database is compromised.

------

## Using `password_hash()`

PHP provides `password_hash()` to create secure password hashes with built-in salt and strong algorithms.

```php
$hash = password_hash('user_password', PASSWORD_DEFAULT);
```

- `PASSWORD_DEFAULT` uses the current strongest algorithm (currently bcrypt).
- The salt is generated automatically.

------

## Verifying Passwords

Use `password_verify()` to check a password against a hash.

```php
if (password_verify($inputPassword, $hash)) {
    echo "Password is valid!";
} else {
    echo "Invalid password.";
}
```

------

## Rehashing Passwords

Check if a hash needs rehashing (e.g., algorithm changed):

```php
if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
    $hash = password_hash($inputPassword, PASSWORD_DEFAULT);
}
```

------

## Storing Password Hashes

- Store the full hash string returned by `password_hash()`.
- Do **not** store raw passwords or salts separately.

------

## Avoid These

- Never use plain MD5, SHA1, or other fast hashes.
- Avoid rolling your own hashing logic.

------

## Practical Example

```php
// Registration
$hash = password_hash($_POST['password'], PASSWORD_DEFAULT);

// Login
if (password_verify($_POST['password'], $storedHash)) {
    // Authenticate user
}
```

------

## Best Practices

- Use `password_hash()` and `password_verify()`.
- Keep PHP updated for the latest hashing algorithms.
- Use HTTPS to protect passwords in transit.
- Implement rate limiting to prevent brute force attacks.

