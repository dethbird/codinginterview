<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Views\Twig;
use Slim\Views\TwigMiddleware;

require __DIR__ . '/../vendor/autoload.php';

$manifest = json_decode(
    file_get_contents(__DIR__ . '/assets/js/.vite/manifest.json'),
    true
);
$mainJs = $manifest['main.jsx']['file'];

$app = AppFactory::create();

// Create Twig
$twig = Twig::create(__DIR__ . '/../templates', ['cache' => false]);
// Add Twig-View Middleware
$app->add(TwigMiddleware::create($app, $twig));

$app->get('/', function (Request $request, Response $response, $args) {
    $view = Twig::fromRequest($request);

    return $view->render($response, 'pages/home.html', [
        'name' => 'Pizza Manz',
        'APP_ENV' => getenv('APP_ENV')
    ]);
});

$app->run();