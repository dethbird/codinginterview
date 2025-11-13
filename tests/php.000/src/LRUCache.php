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
        if (!isset($this->map[$key])) {
            return null;
        }

        // move key to most-recent (end of $order)
        $idx = array_search($key, $this->order, true);
        if ($idx !== false) {
            unset($this->order[$idx]);
            // reindex numeric keys
            $this->order = array_values($this->order);
        }
        $this->order[] = $key;

        return $this->map[$key];
    }

    public function put(int $key, int $value): void
    {
        // if key exists, update and mark most-recent
        if (isset($this->map[$key])) {
            $this->map[$key] = $value;
            $idx = array_search($key, $this->order, true);
            if ($idx !== false) {
                unset($this->order[$idx]);
                $this->order = array_values($this->order);
            }
            $this->order[] = $key;
            return;
        }

        // new key: evict LRU if at capacity
        if (count($this->order) >= $this->capacity) {
            $lru = array_shift($this->order); // removes first (least-recent)
            if ($lru !== null) {
                unset($this->map[$lru]);
            }
        }

        $this->map[$key] = $value;
        $this->order[] = $key;
    }
}
