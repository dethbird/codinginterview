# PHP Namespaces and Autoloading

## What is a Namespace?

Namespaces organize code by grouping related classes, functions, and constants to avoid name collisions, especially in large projects or when using third-party libraries.

------

## Declaring a Namespace

At the top of a PHP file, declare the namespace:

```php
namespace App\Controllers;

class UserController {
    // class code
}
```

------

## Using Namespaces

- Use fully qualified class names:

```php
$user = new \App\Controllers\UserController();
```

- Or import namespaces/classes with `use` keyword:

```php
use App\Controllers\UserController;

$user = new UserController();
```

------

## Sub-namespaces

You can organize namespaces hierarchically:

```php
namespace App\Models\User;
```

------

## Aliasing with `as`

Rename imported classes to avoid conflicts:

```php
use App\Controllers\UserController as UC;

$user = new UC();
```

------

## Autoloading Classes

Autoloading automatically loads class files when needed, avoiding manual includes.

------

### PSR-4 Autoloading Standard

- Namespace corresponds to directory structure.
- Class name corresponds to file name.
- Composer uses PSR-4 for autoloading.

Example:

Namespace `App\Controllers` loads file `src/Controllers/UserController.php`

------

### Composer Autoload Setup

In `composer.json`:

```json
{
  "autoload": {
    "psr-4": {
      "App\\": "src/"
    }
  }
}
```

Then run:

```bash
composer dump-autoload
```

------

### Registering Autoloaders Manually

Without Composer, use `spl_autoload_register`:

```php
spl_autoload_register(function ($class) {
    $path = str_replace('\\', DIRECTORY_SEPARATOR, $class) . '.php';
    include $path;
});
```

------

## Practical Example: Using Namespace and Autoloading

File: `src/Controllers/UserController.php`

```php
namespace App\Controllers;

class UserController {
    public function index() {
        return "User list";
    }
}
```

Usage:

```php
require 'vendor/autoload.php';

use App\Controllers\UserController;

$controller = new UserController();
echo $controller->index(); // User list
```

------

## Best Practices

- Use namespaces to prevent name collisions.
- Follow PSR-4 autoloading to standardize file organization.
- Use Composer for dependency management and autoloading.
- Avoid deeply nested namespaces; keep structure manageable.

