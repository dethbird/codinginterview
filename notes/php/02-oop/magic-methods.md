# PHP Magic Methods

## What Are Magic Methods?

Magic methods are special methods that start with double underscores (`__`) and are triggered automatically in certain object contexts. They let you customize object behavior.

------

## Common Magic Methods

### `__construct()`

Called when an object is instantiated.

```php
class User {
    public function __construct($name) {
        $this->name = $name;
    }
}
```

------

### `__destruct()`

Called when an object is destroyed (script ends or object unset).

```php
class Logger {
    public function __destruct() {
        echo "Object destroyed\n";
    }
}
```

------

### `__toString()`

Called when the object is used as a string.

```php
class User {
    private $name;

    public function __construct($name) {
        $this->name = $name;
    }

    public function __toString() {
        return $this->name;
    }
}

$user = new User("Alice");
echo $user; // Alice
```

------

### `__get($name)` and `__set($name, $value)`

Handle reading and writing inaccessible (private or undefined) properties.

```php
class Data {
    private $data = [];

    public function __get($name) {
        return $this->data[$name] ?? null;
    }

    public function __set($name, $value) {
        $this->data[$name] = $value;
    }
}

$obj = new Data();
$obj->foo = "bar";
echo $obj->foo; // bar
```

------

### `__isset($name)` and `__unset($name)`

Handle `isset()` and `unset()` on inaccessible properties.

------

### `__call($name, $arguments)`

Invoked when calling inaccessible methods.

```php
class Proxy {
    public function __call($name, $arguments) {
        echo "Method $name called with arguments: " . implode(', ', $arguments);
    }
}

$obj = new Proxy();
$obj->foo(1, 2); // Method foo called with arguments: 1, 2
```

------

### `__callStatic($name, $arguments)`

Invoked when calling inaccessible static methods.

------

### `__clone()`

Called when an object is cloned with `clone`.

```php
class Person {
    public $name;
    public function __clone() {
        echo "Cloning $this->name\n";
    }
}
```

------

### `__invoke()`

Allows an object to be called like a function.

```php
class CallableClass {
    public function __invoke($param) {
        return "Called with $param";
    }
}

$obj = new CallableClass();
echo $obj("test"); // Called with test
```

------

### `__debugInfo()`

Customize the output of `var_dump()`.

------

## Practical Example: Dynamic Properties with `__get` and `__set`

```php
class Dynamic {
    private $properties = [];

    public function __get($name) {
        return $this->properties[$name] ?? null;
    }

    public function __set($name, $value) {
        $this->properties[$name] = $value;
    }
}

$obj = new Dynamic();
$obj->color = "red";
echo $obj->color; // red
```

------

## Best Practices

- Use magic methods carefully; they can make code harder to debug.
- Prefer explicit methods when possible.
- Use `__get` and `__set` for proxy or dynamic property patterns.
- Use `__call` to implement flexible method forwarding or decorators.

