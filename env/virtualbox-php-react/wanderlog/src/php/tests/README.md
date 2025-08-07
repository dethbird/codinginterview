Absolutely — that kind of interview is great for demonstrating real-world thinking, practical architecture, and good code hygiene. Since they're *not* focused on Leetcode-style algorithms, the questions will usually cover:

* working with arrays and objects
* CRUD operations
* OOP (object-oriented programming)
* working with APIs
* error handling
* SQL and database queries
* file uploads or form handling
* simple validation
* architectural reasoning (e.g. "how would you structure...")

Let’s start with some **starter PHP coding questions** that are interview-appropriate for a full stack dev.

---

### ✅ 1. Parse an API Response (Associative Array Manipulation)

**Prompt:**
Given the following API response, write a function that extracts the names of users whose accounts are active (`is_active = true`).

```php
$response = [
  ['id' => 1, 'name' => 'Alice', 'is_active' => true],
  ['id' => 2, 'name' => 'Bob', 'is_active' => false],
  ['id' => 3, 'name' => 'Carol', 'is_active' => true],
];
```

---

### ✅ 2. Build a Simple Class

**Prompt:**
Create a class `User` with private properties `$name` and `$email`, and write public getter and setter methods. Instantiate an object of this class and print the name and email.

---

### ✅ 3. Create a Safe Insert into a Database

**Prompt:**
Assume you have a `users` table with columns: `id`, `name`, `email`. Write a function that inserts a new user into the database using PDO. Sanitize and bind the values.

---

### ✅ 4. Validate a Simple Form

**Prompt:**
Write PHP code to validate a form submission with the fields: `name`, `email`, and `age`.
Ensure:

* Name is not empty
* Email is valid
* Age is a number between 18 and 99

Return an array of errors.

---

### ✅ 5. Return JSON Response

**Prompt:**
Create a PHP script that returns a JSON response with `status`, `message`, and optionally `data`. Accepts a GET parameter `name` and returns a greeting.

Example:

```json
{
  "status": "success",
  "message": "Hello, Alice"
}
```

---

### ✅ 6. Read a CSV File and Convert to JSON

**Prompt:**
Write PHP code to open a CSV file `users.csv` with headers `name,email` and convert it into a JSON array.

---

### ✅ 7. Refactor Repetitive Code into a Function

**Prompt:**
You have repeated blocks of code that sanitize strings with `trim`, `stripslashes`, and `htmlspecialchars`. Refactor this into a reusable function.

---

### ✅ 8. Explain MVC in PHP

**Prompt:**
You're working on a PHP MVC framework (like Laravel or CodeIgniter). Explain what each part (Model, View, Controller) is responsible for, and give a brief code example.

---

### ✅ 9. Upload a File Safely

**Prompt:**
Write a snippet that handles a file upload. Only allow `.jpg` and `.png` files, max 2MB. Save the file with a unique name to the `uploads/` directory.

---

### ✅ 10. Log an Error to File

**Prompt:**
Write a function that logs errors to a file `error.log` in the format:

```
[2025-08-07 12:01:23] ERROR: Something went wrong
```

---

Would you like to:

* Work through these one by one (with notes you can save)?
* Focus on a specific type (e.g. database, OOP, form handling)?
* Or go right into mid-level or "architectural reasoning" PHP questions?

Let me know how deep you want to go.

---

Absolutely — here’s a batch of **intermediate-level PHP coding questions**, each designed to be doable in \~10–15 minutes during a practical interview or take-home. They test real-world skills like OOP, database work, file handling, array manipulation, and clean code design — not algorithms.

---

## ✅ Intermediate PHP Interview Questions (10–15 min each)

### 1. **Design a Simple Logger Class**

**Prompt:**
Create a `Logger` class with methods `info($message)` and `error($message)` that log messages to different log files. Include timestamps.

---

### 2. **Group Array Items by a Key**

**Prompt:**
Given an array of users with a `country` key, write a function to group the users by country.

```php
[
  ['name' => 'Alice', 'country' => 'USA'],
  ['name' => 'Bob', 'country' => 'Canada'],
  ['name' => 'Carol', 'country' => 'USA']
]
```

Expected:

```php
[
  'USA' => [['name' => 'Alice'], ['name' => 'Carol']],
  'Canada' => [['name' => 'Bob']]
]
```

---

### 3. **Build a Basic Router**

**Prompt:**
Write a minimal PHP router that handles basic GET routes like `/home`, `/about`, and `/users/:id` using `$_SERVER['REQUEST_URI']`.

---

### 4. **Simple Dependency Injection Example**

**Prompt:**
Write a `Mailer` class that takes a `Transport` object via its constructor. Implement both `SmtpTransport` and `SendmailTransport` classes and demonstrate swapping them.

---

### 5. **Secure File Upload Handler**

**Prompt:**
Write a function to handle a file upload from a form. Only allow images (`jpg`, `png`), max size 2MB. Save with a unique filename in `uploads/`.

---

### 6. **Build a Config Loader**

**Prompt:**
Create a function or class that loads config values from a `.ini` file and provides access like `Config::get('db.host')`.

---

### 7. **Write a Simple API Endpoint**

**Prompt:**
Write a PHP script that accepts a `POST` JSON payload of `{"name": "Alice"}` and returns a `{"message": "Hello, Alice"}` JSON response.

---

### 8. **Create a Reusable Validation Function**

**Prompt:**
Write a `validate($data, $rules)` function to check an input array against rules like `'email' => 'required|email'`, `'age' => 'min:18'`.

---

### 9. **Hydrate an Object from an Array**

**Prompt:**
Given a `User` class with `name`, `email`, and `age` properties, write a function that populates a `User` object from an associative array.

---

### 10. **Simulate a Database in Memory**

**Prompt:**
Using only arrays and no database, simulate an in-memory database with basic CRUD functions: `createUser()`, `getUser()`, `updateUser()`, `deleteUser()`.

---

### 11. **Transform Flat Array to Tree**

**Prompt:**
Convert a flat list of items with `id` and `parent_id` into a nested tree structure (useful for menus or category hierarchies).

---

### 12. **Build a Session-Based Auth Flow**

**Prompt:**
Write login logic that sets a session after a successful email/password match. Include basic `login()`, `logout()`, and `isLoggedIn()` logic using `$_SESSION`.

---

### 13. **Create a Pagination Helper**

**Prompt:**
Write a function that takes `totalItems`, `itemsPerPage`, and `currentPage` and returns an array of pagination info: `totalPages`, `hasNext`, `hasPrev`, `offset`, etc.

---

### 14. **Flatten a Multi-dimensional Array**

**Prompt:**
Write a function that flattens any nested array into a single-level array. Bonus: include depth limit or key prefixing (`user.name`, `user.email`).

---

### 15. **Explain and Use Traits**

**Prompt:**
Explain what PHP Traits are and give an example where you share methods between two classes using a trait like `HasTimestamps`.

---

Would you like full answers for any of these? Or want me to convert them into Markdown note templates with stubbed code so you can practice each one?
