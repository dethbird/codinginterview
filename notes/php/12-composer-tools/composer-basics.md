# PHP Composer: Basics

## What is Composer?

Composer is PHP’s dependency manager. It manages libraries and packages your project depends on.

------

## Installing Composer

Download from [getcomposer.org](https://getcomposer.org/) and install globally or per project.

------

## Creating `composer.json`

Run:

```bash
composer init
```

Or create manually:

```json
{
  "require": {
    "monolog/monolog": "^2.0"
  }
}
```

------

## Installing Packages

```bash
composer install
```

Installs dependencies listed in `composer.json`.

------

## Adding Packages

```bash
composer require vendor/package
```

Automatically updates `composer.json` and installs package.

------

## Autoloading

Composer provides PSR-4 autoloading:

```php
require 'vendor/autoload.php';

use Monolog\Logger;
```

------

## Updating Packages

```bash
composer update
```

Updates all packages to latest versions allowed by constraints.

------

## Removing Packages

```bash
composer remove vendor/package
```

Removes package and updates dependencies.

------

## Practical Example: Using Monolog

```php
require 'vendor/autoload.php';

$log = new Monolog\Logger('app');
$log->pushHandler(new Monolog\Handler\StreamHandler('app.log'));
$log->info('Log message');
```

------

## Best Practices

- Commit `composer.json` and `composer.lock` to version control.
- Use semantic versioning constraints carefully.
- Run `composer update` only when needed.
- Use autoloading instead of manual requires.

