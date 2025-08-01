# PHP Unit Testing: PHPUnit Basics

## What is PHPUnit?

PHPUnit is the most popular testing framework for PHP, used to write and run automated unit tests to verify individual units of code.

------

## Installing PHPUnit

Use Composer to install PHPUnit:

```bash
composer require --dev phpunit/phpunit
```

------

## Writing a Basic Test

Create a test class extending `PHPUnit\Framework\TestCase`:

```php
use PHPUnit\Framework\TestCase;

class CalculatorTest extends TestCase {
    public function testAdd() {
        $calc = new Calculator();
        $result = $calc->add(2, 3);
        $this->assertEquals(5, $result);
    }
}
```

------

## Common Assertions

- `$this->assertEquals($expected, $actual)`
- `$this->assertTrue($condition)`
- `$this->assertFalse($condition)`
- `$this->assertNull($variable)`
- `$this->assertInstanceOf($class, $object)`
- `$this->assertCount($expectedCount, $array)`

------

## Running Tests

Run tests via command line:

```bash
./vendor/bin/phpunit tests
```

------

## Setup and Teardown

- `setUp()`: runs before each test method
- `tearDown()`: runs after each test method

Example:

```php
protected function setUp(): void {
    $this->calculator = new Calculator();
}
```

------

## Grouping Tests

Use annotations to group tests:

```php
/**
 * @group math
 */
public function testSubtract() { ... }
```

Run specific group:

```bash
./vendor/bin/phpunit --group math
```

------

## Practical Example: Testing a Calculator Class

```php
class Calculator {
    public function add($a, $b) {
        return $a + $b;
    }
}
```

Test:

```php
public function testAdd() {
    $calc = new Calculator();
    $this->assertEquals(7, $calc->add(3, 4));
}
```

------

## Best Practices

- Write small, isolated tests.
- Name tests clearly to describe behavior.
- Use data providers for repetitive tests.
- Keep tests fast and independent.
- Mock external dependencies.

