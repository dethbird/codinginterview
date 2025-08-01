# PHP Unit Testing: Mocking

## What is Mocking?

Mocking simulates objects or dependencies to isolate the unit being tested. Mocks replace real implementations during tests.

------

## Creating a Mock with PHPUnit

```php
$mock = $this->createMock(SomeClass::class);
```

------

## Setting Method Expectations

Define how mocks should behave and what to expect:

```php
$mock->expects($this->once())
     ->method('doSomething')
     ->willReturn('result');
```

------

## Using Mocks for Dependency Injection

```php
class UserService {
    protected $mailer;

    public function __construct(Mailer $mailer) {
        $this->mailer = $mailer;
    }

    public function notify() {
        return $this->mailer->send('Hello');
    }
}

public function testNotify() {
    $mailerMock = $this->createMock(Mailer::class);
    $mailerMock->method('send')->willReturn(true);

    $service = new UserService($mailerMock);
    $this->assertTrue($service->notify());
}
```

------

## Partial Mocks

Mocks that only mock some methods, others behave normally.

```php
$partialMock = $this->getMockBuilder(SomeClass::class)
                    ->onlyMethods(['someMethod'])
                    ->getMock();
```

------

## Mocking with Parameters and Exceptions

```php
$mock->method('process')
     ->with($this->equalTo('input'))
     ->willThrowException(new Exception("Error"));
```

------

## Best Practices

- Mock only external dependencies, not the class under test.
- Keep mock expectations simple.
- Use mocks to isolate tests and avoid side effects.
- Prefer interfaces for easier mocking.

