# Laravel Snippets: Artisan Commands

## What is Artisan?

Artisan is Laravel’s command-line interface (CLI) for managing tasks like migrations, controllers, and testing.

------

## Common Artisan Commands

- **Create a controller:**

```bash
php artisan make:controller UserController
```

- **Create a model:**

```bash
php artisan make:model User
```

- **Run migrations:**

```bash
php artisan migrate
```

- **Rollback migrations:**

```bash
php artisan migrate:rollback
```

- **List all routes:**

```bash
php artisan route:list
```

- **Clear cache:**

```bash
php artisan cache:clear
```

------

## Running Tests

```bash
php artisan test
```

------

## Custom Artisan Commands

Create custom commands:

```bash
php artisan make:command SendEmails
```

Register in `app/Console/Kernel.php`.

------

## Scheduling Commands

Use scheduler in `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule) {
    $schedule->command('emails:send')->daily();
}
```

Run scheduler with:

```bash
php artisan schedule:run
```

------

## Practical Example: Creating a Resource Controller

```bash
php artisan make:controller PostController --resource
```

Creates controller with RESTful methods.

------

## Best Practices

- Use Artisan for repetitive tasks.
- Write custom commands for project-specific automation.
- Schedule tasks to run automatically.
- Use route:list to debug route definitions.

