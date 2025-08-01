# Laravel Snippets: Middleware

## What is Middleware?

Middleware filters HTTP requests entering your application, handling tasks like authentication, logging, and CSRF protection.

------

## Defining Middleware

Generate middleware via Artisan:

```bash
php artisan make:middleware CheckAge
```

Example middleware:

```php
namespace App\Http\Middleware;

use Closure;

class CheckAge {
    public function handle($request, Closure $next) {
        if ($request->age < 18) {
            return redirect('home');
        }
        return $next($request);
    }
}
```

------

## Registering Middleware

Register in `app/Http/Kernel.php`:

- **Global middleware**: runs on every request.
- **Route middleware**: applied to specific routes.

Example route middleware registration:

```php
protected $routeMiddleware = [
    'age' => \App\Http\Middleware\CheckAge::class,
];
```

------

## Using Middleware on Routes

Apply middleware to a route or group:

```php
Route::get('profile', function () {
    // Only accessible if 'age' middleware passes
})->middleware('age');
```

Group routes:

```php
Route::middleware(['auth', 'age'])->group(function () {
    Route::get('/dashboard', function () {
        // Protected routes
    });
});
```

------

## Middleware Parameters

Pass parameters to middleware:

```php
Route::get('user/{id}', function ($id) {
    //
})->middleware('role:admin');
```

In middleware:

```php
public function handle($request, Closure $next, $role) {
    // Check user role
}
```

------

## Practical Example: Authentication Middleware

```php
public function handle($request, Closure $next) {
    if (!auth()->check()) {
        return redirect('login');
    }
    return $next($request);
}
```

------

## Best Practices

- Keep middleware focused on a single responsibility.
- Use middleware groups to apply common middleware sets.
- Avoid putting business logic inside middleware.
- Use middleware to enforce security, logging, and request transformations.

