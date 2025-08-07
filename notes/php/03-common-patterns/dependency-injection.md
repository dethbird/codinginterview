# PHP Common Patterns: Dependency Injection (DI)

## What is Dependency Injection?

Dependency Injection is a design pattern where an object receives its dependencies from an external source rather than creating them itself. This promotes loose coupling and easier testing.

------

## Types of Dependency Injection

1. **Constructor Injection** (most common)

Dependencies are passed via the constructor.

```php
class Logger {
    public function log($msg) {
        echo $msg;
    }
}

class UserService {
    protected $logger;

    public function __construct(Logger $logger) {
        $this->logger = $logger;
    }

    public function createUser($name) {
        // ... create user logic
        $this->logger->log("User $name created.");
    }
}

$logger = new Logger();
$service = new UserService($logger);
$service->createUser("Alice");
```

------

1. **Setter Injection**

Dependencies are passed via setter methods.

```php
class UserService {
    protected $logger;

    public function setLogger(Logger $logger) {
        $this->logger = $logger;
    }
}
```

------

1. **Interface Injection**

The dependency provides an injector method that will inject the dependency into any client passed to it.

------

## Benefits of Dependency Injection

- Decouples classes from concrete implementations.
- Makes testing easier (mock dependencies).
- Improves flexibility and maintainability.

------

## Using Dependency Injection with Service Container

Service containers automate dependency injection by resolving and injecting dependencies automatically.

```php
class Mailer {
    protected $transport;

    public function __construct(Transport $transport) {
        $this->transport = $transport;
    }
}
```

A container can instantiate `Mailer` by injecting a `Transport` instance.

------

## Practical Example: Manual vs Container DI

**Manual:**

```php
$transport = new Transport();
$mailer = new Mailer($transport);
```

**Using a container:**

```php
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

- Prefer constructor injection for mandatory dependencies.
- Use setter injection for optional dependencies.
- Use DI to improve testability with mocks and stubs.
- Avoid service locator anti-pattern (don’t fetch dependencies inside classes).

### Example

```php
<?php

interface Transport
{
    public function send(string $to, string $message): void;
}

class SmtpTransport implements Transport
{
    public function send(string $to, string $message): void
    {
        echo "Sending via SMTP to $to: $message\n";
    }
}

class SendmailTransport implements Transport
{
    public function send(string $to, string $message): void
    {
        echo "Sending via Sendmail to $to: $message\n";
    }
}

class Mailer
{
    private Transport $transport;

    public function __construct(Transport $transport)
    {
        $this->transport = $transport;
    }

    public function sendEmail(string $to, string $message): void
    {
        $this->transport->send($to, $message);
    }
}

// 🔁 Inject a transport type:
$smtpMailer = new Mailer(new SmtpTransport());
$smtpMailer->sendEmail('alice@example.com', 'Hello via SMTP');

$sendmailMailer = new Mailer(new SendmailTransport());
$sendmailMailer->sendEmail('bob@example.com', 'Hello via Sendmail');

```