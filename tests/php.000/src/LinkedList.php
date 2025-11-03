<?php
declare(strict_types=1);

namespace App;

final class ListNode
{
    public int $val;
    public ?ListNode $next;
    public function __construct(int $val, ?ListNode $next = null)
    {
        $this->val = $val;
        $this->next = $next;
    }
}

final class LinkedList
{
    /**
     * Reverse a singly linked list. Return new head.
     */
    public static function reverse(?ListNode $head): ?ListNode
    {
        // TODO: iterative reverse
        throw new \RuntimeException('TODO');
    }

    /**
     * Helper to build list from array.
     * @param list<int> $vals
     */
    public static function fromArray(array $vals): ?ListNode
    {
        $head = null;
        $tail = null;
        foreach ($vals as $v) {
            $node = new ListNode($v);
            if ($head === null) { $head = $node; $tail = $node; }
            else { $tail->next = $node; $tail = $node; }
        }
        return $head;
    }

    /**
     * @return list<int>
     */
    public static function toArray(?ListNode $head): array
    {
        $out = [];
        while ($head !== null) {
            $out[] = $head->val;
            $head = $head->next;
        }
        return $out;
    }
}
