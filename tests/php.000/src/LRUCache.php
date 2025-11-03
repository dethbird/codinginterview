<?php
declare(strict_types=1);

namespace App;

/**
 * LRU Cache with fixed capacity.
 * Methods:
 *  - get(int $key): ?int   // returns value or null
 *  - put(int $key, int $value): void
 * Evict least-recently-used item when capacity exceeded.
 */
final class LRUCache
{
    /** @var int */
    private int $capacity;
    /** @var array<int,int> */
    private array $map = [];
    /** @var list<int> most recent at end */
    private array $order = [];

    public function __construct(int $capacity)
    {
        if ($capacity <= 0) {
            throw new \InvalidArgumentException('capacity must be > 0');
        }
        $this->capacity = $capacity;
    }

    public function get(int $key): ?int
    {
        // TODO: move key to most-recent, return value or null
        throw new \RuntimeException('TODO');
    }

    public function put(int $key, int $value): void
    {
        // TODO: insert/update; evict LRU if over capacity
        throw new \RuntimeException('TODO');
    }
}
