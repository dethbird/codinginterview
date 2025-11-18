<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class RemoveNthFromEndTest extends TestCase {
    public function testRemoveNthFromEnd(): void {
        $n1 = new \App\ListNode(1, new \App\ListNode(2, new \App\ListNode(3, new \App\ListNode(4, new \App\ListNode(5)))));
        $result = removeNthFromEnd($n1, 2);
        $vals = [];
        while ($result !== null) {
            $vals[] = $result->val;
            $result = $result->next;
        }
        $this->assertSame([1,2,3,5], $vals);

        $n2 = new \App\ListNode(1);
        $result2 = removeNthFromEnd($n2, 1);
        $this->assertNull($result2);
    }
}
