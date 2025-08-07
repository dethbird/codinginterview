<?php
/**
 * http://wanderlog/test.mid.003.php
 * https://app.insomnia.rest/app/download
 * **Prompt:**
Write a minimal PHP router that handles basic GET routes like `/home`, `/about`, and `/users/:id` using `$_SERVER['REQUEST_URI']`.
 */
$users = [];
$users['3'] = [
    'name' => 'Barry'
];
$route = str_replace($_SERVER['SCRIPT_NAME'], null, $_SERVER['REQUEST_URI']);

switch($route){
    case '/home':
        echo "home";
        break;
    case '/about':
        echo "about";
        break;
    case '/users':
        echo "users";
        break;
    default:
        if(stripos($route, '/users') === 0) {
            $parts = explode("/", $route);
            if (!isset($parts[2])) {
                echo "invalid user id";
            } else {
                if (!isset($users[$parts[2]])) {
                    echo "user not found";
                } else {
                    var_dump($users[$parts[2]]);
                }
            }
            break;
        }
        echo "not found";
}