# PHP Prepared Statements

## What are Prepared Statements?

Prepared statements are a way to safely execute SQL queries by separating the query structure from the data. They prevent SQL injection and improve performance for repeated queries.

------

## How Prepared Statements Work

1. Prepare: The SQL statement template is sent to the database with placeholders.
2. Bind: Data values are bound to placeholders.
3. Execute: The database executes the statement with the bound values.

------

## Using PDO Prepared Statements

```php
$sql = "SELECT * FROM users WHERE email = :email";
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':email', 'user@example.com', PDO::PARAM_STR);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);
```

------

## Binding Parameters

- `bindValue()` binds a value to a parameter.
- `bindParam()` binds a variable by reference (useful if variable changes before execute).

```php
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
$email = 'user@example.com';
$stmt->execute();
```

------

## Positional Placeholders

You can also use `?` as placeholders and bind by position:

```php
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute(['user@example.com']);
$user = $stmt->fetch();
```

------

## Executing with an Array of Values

```php
$stmt = $pdo->prepare("INSERT INTO users (name, email) VALUES (:name, :email)");
$stmt->execute([
    ':name' => 'Alice',
    ':email' => 'alice@example.com'
]);
```

------

## Benefits

- Prevents SQL injection attacks.
- Improves efficiency on repeated queries.
- Helps separate query logic from data.

------

## Practical Example: Updating User Status

```php
$sql = "UPDATE users SET status = :status WHERE id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':status' => 'active',
    ':id' => 123
]);
```

------

## Best Practices

- Always use prepared statements for any user input.
- Prefer named placeholders (`:name`) for readability.
- Bind data with proper PDO parameter types (`PDO::PARAM_STR`, `PDO::PARAM_INT`, etc.).
- Use exceptions for error handling with `PDO::ERRMODE_EXCEPTION`.

