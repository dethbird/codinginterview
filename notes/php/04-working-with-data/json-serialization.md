# PHP JSON Serialization

## What is JSON Serialization?

JSON serialization is the process of converting PHP data structures (arrays, objects) into JSON strings for data exchange, especially in APIs.

------

## Encoding PHP Data to JSON

Use `json_encode()` to convert PHP data into a JSON string.

```php
$data = [
    'name' => 'Alice',
    'age' => 30,
    'active' => true
];

$json = json_encode($data);
echo $json;  // {"name":"Alice","age":30,"active":true}
```

------

## Decoding JSON to PHP

Use `json_decode()` to convert JSON strings back into PHP variables.

```php
$json = '{"name":"Alice","age":30,"active":true}';
$data = json_decode($json, true);  // true returns associative array
print_r($data);
```

------

## Handling Objects

- Without second parameter: returns PHP object.

```php
$obj = json_decode($json);
echo $obj->name;  // Alice
```

------

## Encoding Options

- `JSON_PRETTY_PRINT`: formats JSON with whitespace for readability.
- `JSON_UNESCAPED_UNICODE`: leaves Unicode characters unescaped.
- `JSON_UNESCAPED_SLASHES`: prevents escaping slashes.

Example:

```php
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
```

------

## Handling Errors

Check for encoding/decoding errors with `json_last_error()` and `json_last_error_msg()`.

```php
$json = json_encode($data);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo "JSON encode error: " . json_last_error_msg();
}
```

------

## Custom Object Serialization

Implement `JsonSerializable` interface for custom JSON serialization.

```php
class User implements JsonSerializable {
    private $name;
    private $password;

    public function __construct($name, $password) {
        $this->name = $name;
        $this->password = $password;
    }

    public function jsonSerialize() {
        return [
            'name' => $this->name,
            // password omitted for security
        ];
    }
}

$user = new User("Alice", "secret");
echo json_encode($user);  // {"name":"Alice"}
```

------

## Practical Example: API Response

```php
header('Content-Type: application/json');

$response = [
    'status' => 'success',
    'data' => ['id' => 1, 'name' => 'Alice']
];

echo json_encode($response);
```

------

## Best Practices

- Always set correct HTTP headers when outputting JSON (`Content-Type: application/json`).
- Use `JsonSerializable` for controlling object serialization.
- Check for JSON errors to avoid corrupted data.
- Avoid encoding resources or unsupported types.

