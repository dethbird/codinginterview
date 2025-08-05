# Interview Patterns: Database Query Task in PHP

## Scenario

You often need to write efficient SQL queries and integrate them into PHP, for example, fetching filtered or aggregated data.

------

## Example Task: Find Users with More Than N Orders

### SQL Query

```sql
SELECT users.id, users.name, COUNT(orders.id) AS order_count
FROM users
JOIN orders ON users.id = orders.user_id
GROUP BY users.id, users.name
HAVING order_count > :minOrders
```

------

## Using PDO with Prepared Statements

```php
$minOrders = 5;
$sql = "
    SELECT users.id, users.name, COUNT(orders.id) AS order_count
    FROM users
    JOIN orders ON users.id = orders.user_id
    GROUP BY users.id, users.name
    HAVING order_count > :minOrders
";

$stmt = $pdo->prepare($sql);
$stmt->execute(['minOrders' => $minOrders]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

------

## Practical Tips

- Use joins to combine related tables.
- Use aggregate functions like `COUNT()`, `SUM()`, etc.
- Use `GROUP BY` for aggregation per group.
- Use `HAVING` to filter aggregated results.
- Always use prepared statements to avoid SQL injection.

------

## Performance Tips

- Index foreign keys and columns used in joins and filters.
- Limit returned columns to only those needed.
- Use pagination (`LIMIT` and `OFFSET`) for large result sets.

------

## Best Practices

- Keep SQL readable and maintainable.
- Handle database errors gracefully.
- Use abstraction layers or query builders if appropriate.
- Test queries independently before integration.

