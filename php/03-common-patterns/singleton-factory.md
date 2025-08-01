# PHP Common Patterns: Singleton and Factory

## Singleton Pattern

### What is Singleton?

The Singleton pattern ensures a class has only one instance and provides a global access point to it. Useful for shared resources like database connections.

------

### Basic Singleton Implementation

```php
class Singleton {
    private static $instance = null;

    private function __construct() {
        // private constructor prevents direct instantiation
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Singleton();
        }
        return self::$instance;
    }
}
```

------

### Usage

```php
$singleton1 = Singleton::getInstance();
$singleton2 = Singleton::getInstance();

var_dump($singleton1 === $singleton2);  // bool(true)
```

------

### Important Notes

- Constructor is `private` to prevent creating multiple instances.
- Clone and wakeup methods should be made private to prevent duplication:

```php
private function __clone() {}
private function __wakeup() {}
```

------

## Factory Pattern

### What is Factory?

The Factory pattern provides a method to create objects without specifying the exact class of the object to be created. Useful for managing different types of objects with common interfaces.

------

### Simple Factory Example

```php
interface Product {
    public function getName();
}

class ProductA implements Product {
    public function getName() {
        return "Product A";
    }
}

class ProductB implements Product {
    public function getName() {
        return "Product B";
    }
}

class ProductFactory {
    public static function create($type): Product {
        if ($type === 'A') {
            return new ProductA();
        } elseif ($type === 'B') {
            return new ProductB();
        }
        throw new Exception("Invalid product type");
    }
}
```

------

### Usage

```php
$product = ProductFactory::create('A');
echo $product->getName();  // Product A
```

------

## When to Use

- Singleton: when only one instance of a class is needed globally.
- Factory: when the type of object to create depends on runtime conditions.

------

## Best Practices

- Avoid excessive use of Singleton to prevent global state issues.
- Use Factory to encapsulate object creation and simplify client code.
- Combine with interfaces for flexible, testable designs.