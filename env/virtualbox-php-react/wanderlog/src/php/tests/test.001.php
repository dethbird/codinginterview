<?php

/**
    Prompt:
    Given the following API response, write a function that extracts the names of users whose accounts are active (is_active = true).

    php
    Copy
    Edit
    $response = [
    ['id' => 1, 'name' => 'Alice', 'is_active' => true],
    ['id' => 2, 'name' => 'Bob', 'is_active' => false],
    ['id' => 3, 'name' => 'Carol', 'is_active' => true],
    ];
*/

/**
$response = [
    ['id' => 1, 'name' => 'Alice', 'is_active' => true],
    ['id' => 2, 'name' => 'Bob', 'is_active' => false],
    ['id' => 3, 'name' => 'Carol', 'is_active' => true],
];
$result = array_filter($response, function($user){ return $user['is_active'] === true;});
print_r($result);

$result = array_filter($response, fn($user) => $user['is_active'] === true );
print_r($result);
*/

