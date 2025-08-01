# PHP Query Builder

## What is a Query Builder?

A Query Builder is a tool or library that provides a programmatic, fluent interface to build SQL queries dynamically without writing raw SQL strings. It improves code readability, security, and maintainability.

------

## Benefits of Using Query Builders

- Avoids manual string concatenation for SQL.
- Helps prevent SQL injection.
- Easier to build complex queries programmatically.
- Often supports chaining methods for fluent syntax.

------

## Example: Basic Query Building with a Hypothetical Builder

```php
$query = $db->table('users')
            ->select('id', 'name', 'email')
            ->where('status', '=', 'active')
            ->orderBy('name', 'asc')
            ->limit(10)
            ->get();
```

This would generate and execute an SQL similar to:

```sql
SELECT id, name, email FROM users WHERE status = 'active' ORDER BY name ASC LIMIT 10;
```

------

## Common Query Builder Methods

| Method                                     | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `table($name)`                             | Set the table to query            |
| `select(...$fields)`                       | Specify columns to retrieve       |
| `where($column, $operator, $value)`        | Add where conditions              |
| `orWhere(...)`                             | Add OR conditions                 |
| `orderBy($column, $direction)`             | Sort results                      |
| `limit($count)`                            | Limit the number of results       |
| `offset($count)`                           | Skip a number of results          |
| `join($table, $first, $operator, $second)` | Join tables                       |
| `get()`                                    | Execute the query and get results |
| `insert($data)`                            | Insert new record(s)              |
| `update($data)`                            | Update existing records           |
| `delete()`                                 | Delete records                    |

------

## Example: Complex Query with Joins

```php
$results = $db->table('orders')
              ->join('users', 'orders.user_id', '=', 'users.id')
              ->select('orders.id', 'users.name', 'orders.total')
              ->where('orders.status', 'completed')
              ->orderBy('orders.created_at', 'desc')
              ->get();
```

------

## Using Laravel Query Builder (Example)

```php
$users = DB::table('users')
           ->where('active', 1)
           ->orderBy('name')
           ->limit(5)
           ->get();
```

------

## Security

Query builders use parameter binding internally to prevent SQL injection, so always use their API instead of raw queries.

------

## Practical Example: Insert User

```php
DB::table('users')->insert([
    'name' => 'Alice',
    'email' => 'alice@example.com',
    'created_at' => now(),
]);
```

------

## Best Practices

- Use query builders for dynamic and complex queries.
- Avoid raw SQL when possible.
- Be aware of the query builder’s SQL dialect compatibility.
- Always review generated queries if debugging.