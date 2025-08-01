# PHP Variables

## What is a Variable in PHP?

A variable in PHP is a container used to store data that can be changed during script execution. Variables always start with a dollar sign `$` followed by the variable name.

---

## Variable Naming Rules

- Must start with a letter (a-z, A-Z) or underscore `_`
- Can contain letters, numbers, and underscores
- Case-sensitive (`$var` and `$Var` are different)
- Cannot be a PHP reserved keyword

**Example:**

```php
$firstName = "Alice";  // valid
$_count = 10;          // valid
$2ndPlace = "Bob";     // invalid, starts with number
```

## Dynamic Typing and Types of Variables

PHP is dynamically typed, so you don't declare the type explicitly. A variable's type is determined by the value assigned.

**Common types:**

- Integer: whole numbers
- Float (double): decimal numbers
- String: text
- Boolean: true/false
- Array: ordered or associative collections
- Object: instance of a class
- Null: no value

**Example:**

```php
$age = 25;              // int
$price = 19.99;         // float
$name = "John Doe";     // string
$isActive = true;       // bool
$colors = ["red", "blue"]; // array
```

------

## Assigning and Reassigning Variables

You can assign a value to a variable, and later change it freely.

```php
$count = 5;
$count = $count + 2; // now $count is 7

$message = "Hello";
$message = "Goodbye"; // reassigned string
```

------

## Variable Variables

Sometimes, you want the name of the variable to be dynamic, stored in another variable.

**Example:**

```php
$varName = "foo";
$$varName = "bar";  // Creates $foo = "bar";

echo $foo;  // outputs "bar"
```

*Note:* This technique can make code harder to debug and read, so use sparingly.

------

## Variable Scope

- **Global scope:** Variables declared outside functions are global and inaccessible inside functions unless explicitly imported.
- **Local scope:** Variables declared inside functions are local to that function.

**Example:**

```php
$globalVar = "I'm global";

function testScope() {
    // echo $globalVar; // Error: undefined variable
    global $globalVar;
    echo $globalVar; // outputs: I'm global
}

testScope();
```

Alternatively, access globals via `$GLOBALS` array:

```php
function testScope() {
    echo $GLOBALS['globalVar']; // outputs: I'm global
}
```

------

## Constants vs Variables

Constants store values that do not change throughout script execution.

- Defined with `define()` or `const`.
- No `$` prefix.
- Global scope by default.

**Example:**

```php
define('MAX_USERS', 100);
const PI = 3.14159;

echo MAX_USERS;  // 100
echo PI;         // 3.14159
```

Variables, on the other hand, are mutable.

------

## Superglobals

PHP provides predefined global arrays accessible everywhere:

| Superglobal | Description                           |
| ----------- | ------------------------------------- |
| `$_GET`     | HTTP GET variables                    |
| `$_POST`    | HTTP POST variables                   |
| `$_SESSION` | Session variables                     |
| `$_COOKIE`  | Cookies                               |
| `$_SERVER`  | Server and execution environment info |
| `$_FILES`   | File uploads                          |
| `$_ENV`     | Environment variables                 |
| `$_REQUEST` | Combination of GET, POST, COOKIE      |
| `$GLOBALS`  | All global variables                  |

**Example:**

```php
echo $_SERVER['HTTP_USER_AGENT']; // prints browser info
```

------

## Best Practices

- Use meaningful, descriptive variable names.
- Initialize variables before use.
- Avoid variable variables unless necessary.
- Use constants for values that shouldn’t change.
- Follow consistent naming conventions (e.g., camelCase or snake_case).

------

## Practical Example: Using Variables in a Function

```php
$username = "alice";

function greetUser($name) {
    echo "Hello, $name!";
}

greetUser($username);  // outputs: Hello, alice!
```

------

Let me know if you'd like me to add anything else here — like common pitfalls, memory considerations, or something more advanced! Otherwise, we can move to `arrays.md` next.