# PHP Unit Testing: Test Doubles

## What are Test Doubles?

Test doubles are generic terms for objects that stand in for real components during testing to isolate behavior.

------

## Types of Test Doubles

| Type  | Description                                              | Usage Example                           |
| ----- | -------------------------------------------------------- | --------------------------------------- |
| Dummy | Passed around but never used (e.g., placeholders)        | Passing a required param that’s unused  |
| Fake  | Working implementation, but simpler (e.g., in-memory DB) | Using a simple array instead of real DB |
| Stub  | Provides predefined responses to calls                   | Returning canned data from methods      |
| Spy   | Like stub, but also records information about calls      | Verifying method calls and args         |
| Mock  | Pre-programmed with expectations, can fail tests         | Expecting method calls with arguments   |

------

## Differences

- **Stub vs Mock**: Stubs provide data; mocks assert behavior.
- **Spy** can verify interactions after execution.
- **Fake** is a simplified implementation for tests.

------

## Creating Stubs and Mocks in PHPUnit

```php
// Stub
$stub = $this->createStub(SomeClass::class);
$stub->method('getData')->willReturn('foo');

// Mock with expectation
$mock = $this->createMock(SomeClass::class);
$mock->expects($this->once())
     ->method('process')
     ->with('input')
     ->willReturn('result');
```

------

## When to Use What

- Use **stubs** when you need to control indirect inputs.
- Use **mocks** when you want to verify interactions.
- Use **fakes** for faster or simpler test setups.
- Use **dummies** for unused parameters.

------

## Practical Example: Stub vs Mock

```php
// Stub example
$stub = $this->createStub(Mailer::class);
$stub->method('send')->willReturn(true);

$service = new UserService($stub);
$this->assertTrue($service->notify());

// Mock example
$mock = $this->createMock(Mailer::class);
$mock->expects($this->once())->method('send')->with('Hello');

$service = new UserService($mock);
$service->notify();
```

------

## Best Practices

- Avoid overusing mocks which can make tests fragile.
- Prefer real implementations or fakes when feasible.
- Keep tests focused on behavior, not implementation details.
- Use interfaces to facilitate mocking.

