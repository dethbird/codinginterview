# PHP Composer: Autoloading

## What is Autoloading?

Autoloading automatically loads PHP classes without requiring manual `include` or `require` statements.

------

## PSR-4 Autoloading Standard

Maps namespaces to directory structure.

Example in `composer.json`:

```json
"autoload": {
    "psr-4": {
        "App\\": "src/"
    }
}
```

------

## Using Autoload

After setting autoload in `composer.json`, run:

```bash
composer dump-autoload
```

Then include autoloader:

```php
require 'vendor/autoload.php';

use App\Controllers\UserController;

$user = new UserController();
```

------

## Classmap Autoloading

Explicitly map classes to files:

```json
"autoload": {
    "classmap": ["src/"]
}
```

------

## Files Autoloading

Load specific PHP files automatically:

```json
"autoload": {
    "files": ["src/helpers.php"]
}
```

------

## Optimizing Autoloader

For production, optimize autoloader for performance:

```bash
composer dump-autoload -o
```

------

## Practical Example: Custom Namespace

`src/Models/User.php` with namespace:

```php
namespace App\Models;

class User {
    // ...
}
```

Usage:

```php
use App\Models\User;

$user = new User();
```

------

## Best Practices

- Use PSR-4 for standard autoloading.
- Run `composer dump-autoload` after changes.
- Avoid manual includes where possible.
- Optimize autoloader in production environments.

