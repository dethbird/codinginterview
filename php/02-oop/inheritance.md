# PHP Inheritance

## What is Inheritance?

Inheritance allows a class (child/subclass) to inherit properties and methods from another class (parent/superclass), promoting code reuse and hierarchical relationships.

------

## Basic Syntax

```php
class Vehicle {
    public $brand;

    public function honk() {
        return "Beep beep!";
    }
}

class Car extends Vehicle {
    public $model;

    public function getDetails() {
        return "This is a $this->brand $this->model";
    }
}
```

------

## Using the Classes

```php
$car = new Car();
$car->brand = "Toyota";
$car->model = "Corolla";

echo $car->honk();         // Beep beep! (inherited)
echo $car->getDetails();   // This is a Toyota Corolla
```

------

## Overriding Methods

Child classes can override parent methods by redefining them.

```php
class Car extends Vehicle {
    public function honk() {
        return "Car horn sound!";
    }
}
```

------

## Calling Parent Methods

Use `parent::` to call the parent method inside an overridden method.

```php
class Car extends Vehicle {
    public function honk() {
        return parent::honk() . " But louder!";
    }
}
```

------

## Constructor Inheritance

Parent constructor is **not** called automatically. You must call it explicitly if needed:

```php
class Vehicle {
    public $brand;

    public function __construct($brand) {
        $this->brand = $brand;
    }
}

class Car extends Vehicle {
    public $model;

    public function __construct($brand, $model) {
        parent::__construct($brand);
        $this->model = $model;
    }
}
```

------

## Visibility and Inheritance

- `private` members are **not** accessible in child classes.
- `protected` members are accessible within child classes.
- `public` members are accessible everywhere.

------

## Final Keyword

- `final` keyword prevents a class from being extended or a method from being overridden.

```php
final class BaseClass {}

// class Child extends BaseClass {} // Error: Cannot extend final class

class ParentClass {
    final public function test() {}
}

class ChildClass extends ParentClass {
    // public function test() {} // Error: Cannot override final method
}
```

------

## Practical Example: Animals with Inheritance

```php
class Animal {
    public function speak() {
        return "Some sound";
    }
}

class Dog extends Animal {
    public function speak() {
        return "Bark!";
    }
}

$dog = new Dog();
echo $dog->speak(); // Bark!
```

------

## Best Practices

- Use inheritance for **is-a** relationships.
- Keep inheritance trees shallow for readability.
- Favor composition over inheritance for flexible design.
- Use `final` to prevent unwanted overrides.

