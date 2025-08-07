<?php
/**
Prompt:
Create a PHP script that returns a JSON response with status, message, and optionally data. Accepts a GET parameter name and returns a greeting.

Example:
{
  "status": "success",
  "message": "Hello, Alice"
}
*/

$_GET = [
    'name' => 'Pizza man'
];
var_export($_GET);
$response = [
    'status' => 'success',
    'message' => "Hi, " . ($_GET['name'] ? $_GET['name'] : "user")
];

$data = [
    'pizza' => 'party'
];

if(sizeof($data) > 0) {
    $response['data'] = $data;
}

echo json_encode($response)."\n";
