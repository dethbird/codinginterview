# Laravel Snippets: Routes and Controllers

## Routes

### Defining Routes

Routes map URLs to controller methods or closures.

```php
use Illuminate\Support\Facades\Route;

Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
```

------

### Route Methods

- `get()`, `post()`, `put()`, `patch()`, `delete()`, `any()`
- `match()` accepts multiple HTTP verbs.

------

### Route Parameters

Dynamic segments:

```php
Route::get('/users/{id}', [UserController::class, 'show']);
```

Optional parameters with `?` and default value:

```php
Route::get('/users/{id?}', function ($id = null) {
    return $id ? "User $id" : "All users";
});
```

------

### Named Routes

```php
Route::get('/profile', [UserController::class, 'profile'])->name('profile');
```

Use in code:

```php
route('profile');
```

------

## Controllers

### Creating a Controller

```bash
php artisan make:controller UserController
```

------

### Basic Controller Methods

```php
namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller {
    public function index() {
        return User::all();
    }

    public function show($id) {
        return User::findOrFail($id);
    }

    public function store(Request $request) {
        return User::create($request->all());
    }
}
```

------

### Route Model Binding

Automatic injection of model instances in controller methods:

```php
public function show(User $user) {
    return $user;
}
```

------

### Resource Controllers

Define RESTful routes with one line:

```php
Route::resource('users', UserController::class);
```

------

## Middleware on Routes and Controllers

Apply middleware on routes:

```php
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        // Protected route
    });
});
```

Apply middleware in controller constructor:

```php
public function __construct() {
    $this->middleware('auth');
}
```

------

## Practical Example: User Registration Route

```php
Route::post('/register', [AuthController::class, 'register']);
```

------

## Best Practices

- Use resource controllers for RESTful APIs.
- Use route model binding for cleaner controllers.
- Name your routes for easy referencing.
- Group routes and apply middleware for security.

