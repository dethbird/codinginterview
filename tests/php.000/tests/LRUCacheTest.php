<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\LRUCache;

final class LRUCacheTest extends TestCase
{
    public function testPutGetEvict(): void
    {
        $c = new LRUCache(2);
        $c->put(1, 1);
        $c->put(2, 2);
        $this->assertSame(1, $c->get(1)); // use 1 -> 2 is LRU

        $c->put(3, 3); // evict key 2
        $this->assertNull($c->get(2));
        $this->assertSame(3, $c->get(3));
        
        $c->put(4, 4); // evict key 1
        $this->assertNull($c->get(1));
        $this->assertSame(4, $c->get(4));
    }
}
