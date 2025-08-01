# PHP Composer: Package Development

## Creating a Composer Package

1. **Create your package directory structure**

```
my-package/
├── src/
│   └── MyClass.php
├── composer.json
└── README.md
```

1. **Define `composer.json`**

Example:

```json
{
    "name": "vendor/my-package",
    "description": "A useful PHP package",
    "type": "library",
    "autoload": {
        "psr-4": {
            "Vendor\\MyPackage\\": "src/"
        }
    },
    "require": {
        "php": ">=7.4"
    }
}
```

------

## Writing Code with Namespace

```php
namespace Vendor\MyPackage;

class MyClass {
    public function sayHello() {
        return "Hello from MyPackage!";
    }
}
```

------

## Publishing Package

- Publish your package on [Packagist](https://packagist.org/)
- Tag releases with Git tags (e.g., `v1.0.0`)
- Run `composer update` in projects to install

------

## Using Your Package

Add via Composer:

```bash
composer require vendor/my-package
```

------

## Best Practices

- Follow semantic versioning.
- Write clear documentation.
- Include tests.
- Keep dependencies minimal.
- Use PSR standards for code style and autoloading.

