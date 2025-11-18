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

    public ?ListNode $head = null;
    /**
     * Reverse a singly linked list. Return new head.
     */
    public static function reverse(?ListNode $head): ?ListNode
    {
        // TODO: iterative reverse
        /** @note: I was trying to do this without arrays but HOW */
        // $prev = null;
        // while($head->next) {
        //     $prev = $head;
        //     $next = $head->next;
        //     $next->next = $prev;
        //     $head = $head->next;
        // }
        // return $head;

        // we basically want to reverse the pointers
        // loop using $node->next until null and use refs to manage the pointers
        $prev = null;
        $current = $head;
        while ($current !== null) {
            $next = $current->next;
            $current->next = $prev;
            $prev = $current;
            $current = $next;
        }
        return $prev;


        // @NOTE this is the brute-force way:
        // $arr = self::toArray($head);
        // return self::fromArray(array_reverse($arr));
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

    public function pushFront(int $value): void
    {
        // @todo: insert at the beginning in O(1)
        $node = new ListNode($value);
        $node->next = $this->head;
        $this->head = $node;
        
    }
}
