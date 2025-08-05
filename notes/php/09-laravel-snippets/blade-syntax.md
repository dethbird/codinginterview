# Laravel Snippets: Blade Syntax

## What is Blade?

Blade is Laravel’s templating engine that compiles templates into plain PHP for efficient rendering.

------

## Blade Template Basics

- Use `.blade.php` file extension.
- Template inheritance with `@extends` and `@section`.

Example:

```blade
{{-- layouts/app.blade.php --}}
<html>
<head><title>@yield('title')</title></head>
<body>
    @yield('content')
</body>
</html>
```

Child template:

```blade
@extends('layouts.app')

@section('title', 'Page Title')

@section('content')
    <h1>Hello, Blade!</h1>
@endsection
```

------

## Echoing Data

```blade
{{ $variable }}
```

Escapes output for security.

To output raw HTML:

```blade
{!! $html !!}
```

------

## Control Structures

### Conditionals

```blade
@if ($user->isAdmin())
    <p>Welcome Admin</p>
@elseif ($user->isMember())
    <p>Welcome Member</p>
@else
    <p>Welcome Guest</p>
@endif
```

### Loops

```blade
@foreach ($users as $user)
    <p>{{ $user->name }}</p>
@endforeach
```

------

## Components and Slots

Reusable UI components.

```blade
<x-alert type="error" :message="$errorMessage" />
```

Define component:

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

------

## Includes

Include other views:

```blade
@include('partials.header')
```

------

## CSRF Protection

Use `@csrf` directive inside forms:

```blade
<form method="POST" action="/submit">
    @csrf
    <!-- form fields -->
</form>
```

------

## Practical Example: Loop with Conditional

```blade
<ul>
@foreach ($items as $item)
    <li>
        {{ $item->name }}
        @if ($item->isNew())
            <span>New!</span>
        @endif
    </li>
@endforeach
</ul>
```

------

## Best Practices

- Escape output unless you’re sure it’s safe.
- Use components for reusable UI parts.
- Use layouts and sections for consistent page structure.
- Use directives to keep templates clean and readable.

