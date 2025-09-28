# PHP GraphQL (HTTP) + ReactPHP Subscriptions (WS) + Redis — Runnable Demo

A minimal, framework‑light setup you can run locally:

* **HTTP (queries/mutations)**: PHP + `webonyx/graphql-php` on `http://localhost:8000/graphql`
* **Subscriptions (WebSocket)**: ReactPHP + Ratchet on `ws://localhost:8081`
* **Bridge**: Redis pub/sub to broadcast events from HTTP mutations to WS subscribers
* **Client**: a tiny HTML page to test query/mutation + subscribe flow

---

## Project tree

```
php-graphql-http+subscriptions-demo/
├─ docker-compose.yml
├─ composer.json
├─ src/
│  ├─ schema.php
│  ├─ resolvers.php
│  ├─ EventBus.php
│  └─ ws-server.php
├─ public/
│  └─ index.php
└─ client/
   └─ index.html
```

---

## docker-compose.yml

```yaml
version: '3.9'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "no"]

  # optional helper: php-fpm or nginx are not required; we'll use PHP built-in server for HTTP
```

---

## composer.json

```json
{
  "name": "demo/php-graphql-subscriptions",
  "type": "project",
  "require": {
    "webonyx/graphql-php": "^15.14",
    "predis/predis": "^2.5",
    "cboden/ratchet": "^0.4.4",
    "react/event-loop": "^1.5",
    "react/socket": "^1.14"
  },
  "autoload": {
    "psr-4": {
      "Demo\\": "src/"
    }
  }
}
```

---

## src/EventBus.php (Redis helper)

```php
<?php
namespace Demo;

use Predis\Client;

class EventBus
{
    private Client $redis;

    public function __construct(?Client $client = null)
    {
        $this->redis = $client ?: new Client(['scheme' => 'tcp', 'host' => '127.0.0.1', 'port' => 6379]);
    }

    public function publish(string $channel, array $payload): void
    {
        $this->redis->publish($channel, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }
}
```

---

## src/resolvers.php

```php
<?php
use Demo\EventBus;
use GraphQL\Type\Definition\ResolveInfo;

$messages = $messages ?? [];

return [
    'Query' => [
        'ping' => fn() => 'pong',
        'messages' => function() use (&$messages) { return array_values($messages); },
    ],

    'Mutation' => [
        'postMessage' => function($root, $args, $ctx, ResolveInfo $info) use (&$messages) {
            $msg = [
                'id' => (string)(count($messages) + 1),
                'roomId' => $args['roomId'],
                'author' => $args['author'],
                'text' => $args['text'],
                'createdAt' => (new DateTimeImmutable())->format(DATE_ATOM),
            ];
            $messages[$msg['id']] = $msg; // naive in-memory store

            // publish to WS via Redis
            $bus = new EventBus($ctx['redis'] ?? null);
            $bus->publish('gql:messageAdded', $msg);

            return $msg;
        }
    ],
];
```

---

## src/schema.php (webonyx schema)

```php
<?php
use GraphQL\GraphQL;
use GraphQL\Type\Schema;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;

require __DIR__ . '/../vendor/autoload.php';

$MessageType = new ObjectType([
    'name' => 'Message',
    'fields' => fn() => [
        'id' => Type::nonNull(Type::id()),
        'roomId' => Type::nonNull(Type::id()),
        'author' => Type::nonNull(Type::string()),
        'text' => Type::nonNull(Type::string()),
        'createdAt' => Type::nonNull(Type::string()),
    ]
]);

$QueryType = new ObjectType([
    'name' => 'Query',
    'fields' => [
        'ping' => [ 'type' => Type::nonNull(Type::string()) ],
        'messages' => [ 'type' => Type::nonNull(Type::listOf(Type::nonNull($MessageType))) ],
    ]
]);

$MutationType = new ObjectType([
    'name' => 'Mutation',
    'fields' => [
        'postMessage' => [
            'type' => Type::nonNull($MessageType),
            'args' => [
                'roomId' => Type::nonNull(Type::id()),
                'author' => Type::nonNull(Type::string()),
                'text' => Type::nonNull(Type::string()),
            ]
        ],
    ]
]);

$schema = new Schema([
    'query' => $QueryType,
    'mutation' => $MutationType,
]);
```

---

## public/index.php (HTTP endpoint for /graphql)

```php
<?php
require __DIR__ . '/../vendor/autoload.php';

use GraphQL\GraphQL;
use GraphQL\Error\DebugFlag;
use Predis\Client as Redis;

$schema = require __DIR__ . '/../src/schema.php';
$resolvers = require __DIR__ . '/../src/resolvers.php';

// Very small executor: map root fields to resolver closures
$rootValue = null;
$context = [ 'redis' => new Redis(['host' => '127.0.0.1', 'port' => 6379]) ];

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: [];
$query = $input['query'] ?? '{ ping }';
$variables = $input['variables'] ?? null;
$operation = $input['operationName'] ?? null;

$exeContext = [
  'fieldResolver' => function($source, $args, $ctx, $info) use ($resolvers) {
      $parent = $info->parentType->name;   // Query | Mutation | Message
      $field  = $info->fieldName;          // ping | messages | postMessage
      if (isset($resolvers[$parent][$field])) {
          return $resolvers[$parent][$field]($source, $args, $ctx, $info);
      }
      return $source[$field] ?? null;
  }
];

try {
    $result = GraphQL::executeQuery($schema, $query, $rootValue, $context, $variables, $operation, $exeContext['fieldResolver']);
    $output = $result->toArray(DebugFlag::INCLUDE_DEBUG_MESSAGE | DebugFlag::INCLUDE_TRACE);
} catch (Throwable $e) {
    http_response_code(500);
    $output = ['errors' => [['message' => $e->getMessage()]]];
}

header('Content-Type: application/json');
echo json_encode($output);
```

> **Run with PHP builtin server:** `php -S 127.0.0.1:8000 -t public`

---

## src/ws-server.php (ReactPHP + Ratchet WS + Redis pub/sub)

```php
<?php
require __DIR__ . '/../vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use React\EventLoop\Factory as LoopFactory;
use React\Socket\SocketServer;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use Clue\React\Redis\Factory as RedisFactory;

class SubscriptionServer implements MessageComponentInterface
{
    private $clients;
    private $subs;

    public function __construct()
    {
        $this->clients = new SplObjectStorage();
        $this->subs = new SplObjectStorage();
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        $this->subs[$conn] = [];
        $conn->send(json_encode(['type' => 'hello']));
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        if (($data['type'] ?? '') === 'subscribe') {
            $field = $data['field'] ?? 'messageAdded';
            $vars = $data['variables'] ?? [];
            $list = $this->subs[$from];
            $list[] = ['field' => $field, 'variables' => $vars];
            $this->subs[$from] = $list;
            $from->send(json_encode(['type' => 'subscribed', 'field' => $field]));
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        unset($this->subs[$conn]);
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        $conn->close();
    }

    public function broadcast(string $field, array $payload)
    {
        foreach ($this->clients as $client) {
            $subs = $this->subs[$client] ?? [];
            foreach ($subs as $sub) {
                if ($sub['field'] !== $field) continue;
                $want = $sub['variables']['roomId'] ?? null;
                $have = $payload['roomId'] ?? null;
                if ($want && $have && $want !== $have) continue;
                $client->send(json_encode(['type' => 'next', 'data' => [$field => $payload]]));
            }
        }
    }
}

$loop = LoopFactory::create();
$redisFactory = new RedisFactory($loop);
$subServer = new SubscriptionServer();

$pubsub = $redisFactory->createLazyClient('redis://127.0.0.1:6379');
$pubsub->subscribe('gql:messageAdded');
$pubsub->on('message', function ($channel, $message) use ($subServer) {
    $payload = json_decode($message, true) ?: [];
    $subServer->broadcast('messageAdded', $payload);
});

$socket = new SocketServer('0.0.0.0:8081', [], $loop);
$ws = new WsServer($subServer);
$http = new HttpServer($ws);
$io = new IoServer($http, $socket, $loop);

echo "WS listening on ws://localhost:8081\n";
$loop->run();
```

---

## client/index.html (quick test UI)

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphQL + Subscriptions Demo</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; }
    pre { background: #111; color: #eee; padding: 1rem; overflow: auto; }
    input, button { padding: .5rem; }
  </style>
</head>
<body>
  <h1>GraphQL HTTP + WS Subscriptions</h1>

  <section>
    <h2>Subscribe</h2>
    <label>roomId <input id="room" value="123"/></label>
    <button id="connect">Connect WS</button>
    <pre id="log"></pre>
  </section>

  <section>
    <h2>Post Message (HTTP mutation)</h2>
    <label>author <input id="author" value="rishi"/></label>
    <label>text <input id="text" value="hello world"/></label>
    <button id="send">postMessage</button>
    <pre id="resp"></pre>
  </section>

  <script>
    const log = (m) => document.getElementById('log').textContent += m + "\n";
    let ws;

    document.getElementById('connect').onclick = () => {
      const roomId = document.getElementById('room').value;
      ws = new WebSocket('ws://localhost:8081');
      ws.onopen = () => {
        log('WS connected');
        ws.send(JSON.stringify({ type: 'subscribe', field: 'messageAdded', variables: { roomId } }));
      };
      ws.onmessage = (e) => log('WS: ' + e.data);
      ws.onclose = () => log('WS closed');
    };

    document.getElementById('send').onclick = async () => {
      const roomId = document.getElementById('room').value;
      const author = document.getElementById('author').value;
      const text = document.getElementById('text').value;
      const res = await fetch('http://localhost:8000/graphql', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation($roomId: ID!, $author: String!, $text: String!) {\n  postMessage(roomId: $roomId, author: $author, text: $text) { id roomId author text createdAt }\n}`,
          variables: { roomId, author, text }
        })
      });
      document.getElementById('resp').textContent = JSON.stringify(await res.json(), null, 2);
    };
  </script>
</body>
</html>
```

---

## Run it

```bash
# 1) start Redis
docker compose up -d

# 2) install PHP deps
composer install

# 3) run HTTP GraphQL endpoint
php -S 127.0.0.1:8000 -t public

# 4) (separate terminal) run WS subscriptions server
php src/ws-server.php

# 5) open the client
# simply open client/index.html in your browser (file:///…)
# or serve it: python -m http.server 5173 -d client
```

---

## Notes / Next steps

* This demo uses an **in-memory array** for messages; swap in MySQL/Postgres as needed.
* To speak Apollo’s `graphql-ws` protocol, add a small protocol layer (init/subscribe/next/complete) or use a library.
* Add **JWT** on WS connect, verify, and pass user/tenant into the subscription context for filtering.
* For production, manage processes via **systemd**, **supervisord**, or **Docker Compose** with healthchecks.
* Scale WS horizontally: multiple WS instances subscribe to Redis and broadcast to their own connected clients.

```
```



Dropped a runnable demo on the canvas:

* webonyx GraphQL over HTTP (`/graphql`)
* ReactPHP + Ratchet WebSocket subscriptions
* Redis pub/sub bridge
* Minimal HTML client to prove the loop (subscribe → mutation → pushed event)

### How to run

1. `docker compose up -d` (Redis)
2. `composer install`
3. `php -S 127.0.0.1:8000 -t public`
4. In another terminal: `php src/ws-server.php`
5. Open `client/index.html`, click “Connect WS,” then post a message.

Want me to add JWT auth on both HTTP and WS sides next, or wire it to Postgres so `messages` persist between runs?
