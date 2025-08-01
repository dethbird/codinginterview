# PHP Common Patterns: Service Container

## What is a Service Container?

A Service Container (or Dependency Injection Container) is a tool to manage class dependencies and perform dependency injection automatically. It centralizes object creation and configuration.

------

## Why Use a Service Container?

- Decouples class instantiation from application logic.
- Simplifies dependency management.
- Facilitates easier testing and maintenance.

------

## Basic Service Container Example

```php
class Container {
    protected $bindings = [];

    public function bind($name, callable $resolver) {
        $this->bindings[$name] = $resolver;
    }

    public function make($name) {
        if (isset($this->bindings[$name])) {
            return $this->bindings[$name]($this);
        }
        throw new Exception("Service $name not found");
    }
}
```

------

## Binding and Resolving Services

```php
$container = new Container();

$container->bind('logger', function() {
    return new Logger();
});

$logger = $container->make('logger');
```

------

## Resolving Dependencies Automatically (Simple Example)

```php
class Database {
    public function __construct($dsn) {
        // ...
    }
}

$container->bind('db', function() {
    return new Database('mysql:host=localhost;dbname=test');
});

$db = $container->make('db');
```

------

## Usage in Frameworks

Frameworks like Laravel have advanced service containers that:

- Automatically resolve class dependencies via reflection.
- Support singleton/shared bindings.
- Support contextual binding (different implementations per context).

------

## Practical Example: Resolving Dependencies

```php
class Mailer {
    protected $transport;

    public function __construct(Transport $transport) {
        $this->transport = $transport;
    }
}

class Transport {
    // ...
}

$container->bind('Transport', function() {
    return new Transport();
});

$container->bind('Mailer', function($c) {
    return new Mailer($c->make('Transport'));
});

$mailer = $container->make('Mailer');
```

------

## Best Practices

- Use containers to reduce tight coupling.
- Avoid overusing service containers for trivial cases.
- Leverage containers for managing complex object graphs.
- Use container features like singletons or scoped instances as needed.