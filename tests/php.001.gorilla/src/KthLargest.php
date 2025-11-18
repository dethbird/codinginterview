<?php
declare(strict_types=1);

namespace App;

class KthLargest
{
    private int $k;

    // @var SplPriorityQueue  // min-heap simulated via negative priority or custom compare
    private SplPriorityQueue $heap;

    public function __construct(int $k, array $initial = [])
    {
        $this->k = $k;
        $this->heap = new \SplPriorityQueue();
        // SplPriorityQueue is a max-heap, so use negative values for min-heap simulation
        foreach ($initial as $num) {
            $this->heap->insert($num, -$num);
            if ($this->heap->count() > $this->k) {
                $this->heap->extract();
            }
        }
    }

    public function add(int $val): int
    {
        $this->heap->insert($val, -$val);
        if ($this->heap->count() > $this->k) {
            $this->heap->extract();
        }
        // The top of the heap is the k-th largest
        return $this->heap->top();
    }

    public function findKthLargest(int $k): int
    {
        // Just return the top of the heap
        return $this->heap->top();
    }

}