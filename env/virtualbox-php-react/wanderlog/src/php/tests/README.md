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
