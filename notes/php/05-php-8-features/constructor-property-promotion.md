# PHP 8 Features: Constructor Property Promotion

## What is Constructor Property Promotion?

Constructor Property Promotion lets you declare and initialize class properties directly in the constructor parameters, reducing boilerplate code.

------

## Before PHP 8

```php
class User {
    public string $name;
    public int $age;

    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }
}
```

------

## With Constructor Property Promotion (PHP 8+)

```php
class User {
    public function __construct(
        public string $name,
        public int $age
    ) {}
}
```

------

## Visibility Keywords Allowed

- `public`
- `protected`
- `private`

These keywords declare the property and control its visibility.

------

## Benefits

- Less code, more concise classes.
- Clear declaration of properties and constructor parameters in one place.
- Avoids repetitive property declarations and assignments.

------

## Practical Example

```php
class Product {
    public function __construct(
        private int $id,
        protected string $name,
        public float $price
    ) {}

    public function getName(): string {
        return $this->name;
    }
}

$product = new Product(1, "Laptop", 999.99);
echo $product->getName(); // Laptop
```

------

## Limitations

- Only works with constructor parameters.
- Cannot declare typed properties outside the constructor if you use promotion.
- Complex initialization logic still requires explicit constructor code.

------

## Best Practices

- Use property promotion to simplify data classes and value objects.
- Combine with typed properties for type safety.
- Avoid overusing when constructor logic is complex.

