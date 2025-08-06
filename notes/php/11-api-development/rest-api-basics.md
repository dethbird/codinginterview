# PHP API Development: REST API Basics

## What is a REST API?

REST (Representational State Transfer) is an architectural style for designing networked applications using standard HTTP methods.

------

## HTTP Methods Used in REST

- **GET**: Retrieve resource(s).
- **POST**: Create a new resource.
- **PUT**: Update an existing resource.
- **PATCH**: Partially update a resource.
- **DELETE**: Remove a resource.

------

## REST Principles

- Stateless communication: each request contains all information.
- Resources identified by URLs.
- Use HTTP status codes to indicate results.
- Support multiple data formats, usually JSON.

------

## Designing RESTful Routes

| Operation      | HTTP Method | Example URL     |
| -------------- | ----------- | --------------- |
| Get all users  | GET         | /api/users      |
| Get user by ID | GET         | /api/users/{id} |
| Create user    | POST        | /api/users      |
| Update user    | PUT/PATCH   | /api/users/{id} |
| Delete user    | DELETE      | /api/users/{id} |

------

## Returning JSON Responses

Set the header and encode data as JSON:

```php
header('Content-Type: application/json');
echo json_encode($data);
```

------

## Using HTTP Status Codes

| Status Code | Meaning               |
| ----------- | --------------------- |
| 200         | OK                    |
| 201         | Created               |
| 204         | No Content            |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 404         | Not Found             |
| 500         | Internal Server Error |

Set status code:

```php
http_response_code(201);
```

------

## Practical Example: Simple User API Endpoint

```php
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $users = getUsersFromDb();
    header('Content-Type: application/json');
    echo json_encode($users);
    http_response_code(200);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
```

------

## Best Practices

- Follow RESTful conventions for URLs and HTTP methods.
- Return appropriate status codes.
- Always use JSON for data interchange.
- Validate and sanitize input.
- Use authentication and rate limiting.

