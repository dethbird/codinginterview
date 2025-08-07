<?php
/**
**Prompt:**
Write PHP code to validate a form submission with the fields: `name`, `email`, and `age`.
Ensure:

* Name is not empty
* Email is valid
* Age is a number between 18 and 99

Return an array of errors.
*/

$_POST = [
    'name' => '>>',
    'email' => 'pizza',
    'age' => 450
];
var_dump($_POST);
$errors = [];
$errors['name'] = filter_var($_POST['name'], FILTER_SANITIZE_STRING) !== "";
$errors['email'] = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
$errors['age'] = filter_var($_POST['age'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 18, 'max_range' => 99]]);
var_dump($errors); // errors == false
