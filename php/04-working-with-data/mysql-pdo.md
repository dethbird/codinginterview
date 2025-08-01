# PHP MySQL with PDO

## What is PDO?

PDO (PHP Data Objects) is a database access layer providing a uniform method to access multiple databases with prepared statements, parameter binding, and error handling.

------

## Connecting to MySQL Using PDO

```php
$dsn = 'mysql:host=localhost;dbname=testdb;charset=utf8mb4';
$username = 'dbuser';
$password = 'dbpass';

try {
    $pdo = new PDO($dsn, $username, $password);
    // Set error mode to exception for better error handling
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
```

------

## Executing Queries

### Simple Query (No parameters)

```php
$stmt = $pdo->query("SELECT * FROM users");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
```

------

### Prepared Statements with Parameters

Prevents SQL injection by binding parameters.

```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
$stmt->execute(['email' => 'user@example.com']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
```

------

## Fetch Modes

- `PDO::FETCH_ASSOC` — returns associative arrays
- `PDO::FETCH_OBJ` — returns objects
- `PDO::FETCH_NUM` — returns numeric-indexed arrays

Example:

```php
$stmt->fetchAll(PDO::FETCH_OBJ);
```

------

## Inserting Data

```php
$stmt = $pdo->prepare("INSERT INTO users (name, email) VALUES (:name, :email)");
$stmt->execute([
    'name' => 'Alice',
    'email' => 'alice@example.com'
]);
```

------

## Transactions

Use transactions to group queries:

```php
$pdo->beginTransaction();

try {
    $pdo->exec("INSERT INTO accounts (name) VALUES ('John')");
    $pdo->exec("INSERT INTO balances (account_name, balance) VALUES ('John', 1000)");
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Failed: " . $e->getMessage();
}
```

------

## Error Handling

Set error mode to throw exceptions:

```php
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

Catch exceptions with try-catch blocks.

------

## Practical Example: Select Users by Status

```php
$status = 'active';
$stmt = $pdo->prepare("SELECT * FROM users WHERE status = :status");
$stmt->execute(['status' => $status]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

------

## Best Practices

- Always use prepared statements to prevent SQL injection.
- Use transactions for multiple related queries.
- Set error mode to exception for easier debugging.
- Use proper character encoding (`utf8mb4`).
- Close connections by setting PDO instance to null if needed.

