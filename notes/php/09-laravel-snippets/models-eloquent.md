# Laravel Snippets: Eloquent Models

## What is Eloquent?

Eloquent is Laravel’s ORM (Object-Relational Mapper) for working with databases using ActiveRecord style.

------

## Defining a Model

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model {
    // The table is "users" by default (plural of class name)
}
```

------

## Basic Queries

```php
// Get all users
$users = User::all();

// Find by primary key
$user = User::find(1);

// Find or fail
$user = User::findOrFail(1);
```

------

## Creating and Updating

```php
// Create
$user = User::create(['name' => 'Alice', 'email' => 'alice@example.com']);

// Update
$user->name = 'Bob';
$user->save();
```

------

## Mass Assignment Protection

Specify fillable fields to protect from mass assignment vulnerabilities.

```php
protected $fillable = ['name', 'email'];
```

------

## Query Scopes

Define reusable query logic inside model:

```php
public function scopeActive($query) {
    return $query->where('active', 1);
}

$activeUsers = User::active()->get();
```

------

## Relationships

### One-to-One

```php
public function profile() {
    return $this->hasOne(Profile::class);
}
```

### One-to-Many

```php
public function posts() {
    return $this->hasMany(Post::class);
}
```

### Many-to-Many

```php
public function roles() {
    return $this->belongsToMany(Role::class);
}
```

------

## Accessors and Mutators

Customize attribute access and storage:

```php
// Accessor
public function getNameAttribute($value) {
    return ucfirst($value);
}

// Mutator
public function setNameAttribute($value) {
    $this->attributes['name'] = strtolower($value);
}
```

------

## Timestamps and Soft Deletes

- Models use `created_at` and `updated_at` timestamps by default.
- Enable soft deletes to mark records as deleted without removing:

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model {
    use SoftDeletes;
}
```

------

## Practical Example: Fetch Active Users

```php
$users = User::where('active', 1)->orderBy('created_at', 'desc')->get();
```

------

## Best Practices

- Protect mass assignment with `$fillable` or `$guarded`.
- Use relationships to simplify complex queries.
- Use query scopes for reusable query constraints.
- Keep models focused on data logic, avoid business logic.

