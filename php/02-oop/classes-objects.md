# PHP Classes and Objects

## What is a Class?

A class is a blueprint for creating objects. It defines properties (variables) and methods (functions) that the objects created from it will have.

------

## Defining a Class

```php
class Car {
    public $color;
    public $model;

    public function __construct($color, $model) {
        $this->color = $color;
        $this->model = $model;
    }

    public function drive() {
        return "Driving a $this->color $this->model";
    }
}
```

- `public` means accessible from anywhere.
- `__construct` is a special method called when creating an instance.
- `$this` refers to the current object.

------

## Creating Objects (Instances)

```php
$myCar = new Car("red", "Toyota");
echo $myCar->drive();  // Driving a red Toyota
```

------

## Properties and Methods

- Properties store data.
- Methods define behavior.

Access them using the arrow `->` operator.

```php
echo $myCar->color;    // red
$myCar->color = "blue";
echo $myCar->drive();  // Driving a blue Toyota
```

------

## Visibility: `public`, `private`, `protected`

- `public`: accessible everywhere
- `private`: accessible only inside the class
- `protected`: accessible inside the class and subclasses

```php
class Example {
    private $secret = "hidden";

    public function revealSecret() {
        return $this->secret;
    }
}

$obj = new Example();
// echo $obj->secret; // Error: private property
echo $obj->revealSecret(); // works: outputs "hidden"
```

------

## Static Properties and Methods

Static members belong to the class, not an instance.

```php
class Counter {
    public static $count = 0;

    public static function increment() {
        self::$count++;
    }
}

Counter::increment();
echo Counter::$count;  // 1
```

Use `self::` inside the class to refer to static members.

------

## Magic Methods: `__construct`, `__destruct`, `__toString`, etc.

- `__construct()`: called on object creation
- `__destruct()`: called on object destruction
- `__toString()`: defines object string representation

```php
class Person {
    public $name;

    public function __construct($name) {
        $this->name = $name;
    }

    public function __toString() {
        return $this->name;
    }
}

$p = new Person("Alice");
echo $p;  // outputs "Alice"
```

------

## Practical Example: Simple Bank Account Class

```php
class BankAccount {
    private $balance = 0;

    public function deposit($amount) {
        if ($amount > 0) {
            $this->balance += $amount;
        }
    }

    public function getBalance() {
        return $this->balance;
    }
}

$account = new BankAccount();
$account->deposit(100);
echo $account->getBalance();  // 100
```

------

## Best Practices

- Use appropriate visibility (`private` by default).
- Use constructors to initialize objects.
- Avoid public properties when possible; prefer getters/setters.
- Use static properties/methods for data/behavior shared by all instances.
- Use magic methods wisely to improve class usability.

