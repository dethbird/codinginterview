# PHP Interfaces and Traits

## Interfaces

### What is an Interface?

An interface defines a contract — a set of method signatures a class **must** implement without providing the method bodies.

------

### Defining and Implementing an Interface

```php
interface Logger {
    public function log(string $message);
}

class FileLogger implements Logger {
    public function log(string $message) {
        echo "Logging to file: $message";
    }
}
```

------

### Why Use Interfaces?

- Enforce consistent API across unrelated classes.
- Enable polymorphism: different classes can be treated the same if they implement the same interface.
- Support multiple implementations.

------

### Implementing Multiple Interfaces

```php
interface Logger {
    public function log(string $message);
}

interface Mailer {
    public function send(string $to, string $subject, string $body);
}

class Notification implements Logger, Mailer {
    public function log(string $message) {
        // log message
    }
    public function send(string $to, string $subject, string $body) {
        // send email
    }
}
```

------

## Traits

### What is a Trait?

A trait is a reusable set of methods that can be included inside classes to share functionality without using inheritance.

------

### Defining and Using a Trait

```php
trait LoggerTrait {
    public function log(string $message) {
        echo "Log: $message";
    }
}

class User {
    use LoggerTrait;
}

$user = new User();
$user->log("User created"); // Log: User created
```

------

### Why Use Traits?

- Avoid code duplication across unrelated classes.
- Traits allow horizontal code reuse (different from vertical inheritance).
- Classes can use multiple traits.

------

### Resolving Trait Conflicts

If multiple traits define the same method, use `insteadof` and `as` keywords to resolve conflicts.

```php
trait A {
    public function sayHello() {
        echo "Hello from A";
    }
}

trait B {
    public function sayHello() {
        echo "Hello from B";
    }
}

class MyClass {
    use A, B {
        B::sayHello insteadof A;
        A::sayHello as sayHelloFromA;
    }
}

$obj = new MyClass();
$obj->sayHello();         // Hello from B
$obj->sayHelloFromA();    // Hello from A
```

------

## Differences: Interface vs Trait

| Feature        | Interface                           | Trait                                   |
| -------------- | ----------------------------------- | --------------------------------------- |
| Purpose        | Define method signatures (contract) | Provide reusable method implementations |
| Methods        | No implementation                   | Has implementation                      |
| Multiple Usage | Can implement multiple interfaces   | Can use multiple traits                 |
| Inheritance    | Implemented by classes              | Used inside classes                     |

------

## Practical Example: Logger Interface with Trait

```php
interface Logger {
    public function log(string $message);
}

trait FileLogger {
    public function log(string $message) {
        echo "Logging to file: $message";
    }
}

class App implements Logger {
    use FileLogger;
}

$app = new App();
$app->log("App started");
```

------

## Best Practices

- Use interfaces to define clear contracts.
- Use traits for sharing reusable method implementations.
- Avoid traits that introduce state (properties), focus on behavior.
- Prefer composition over inheritance where appropriate.

