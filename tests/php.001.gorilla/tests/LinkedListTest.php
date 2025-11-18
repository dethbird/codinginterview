<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\LinkedList;

final class LinkedListTest extends TestCase
{
    public function testReverse(): void
    {
        $head = LinkedList::fromArray([1,2,3,4]);
        $rev = LinkedList::reverse($head);
        $this->assertSame([4,3,2,1], LinkedList::toArray($rev));
        $this->assertSame([], LinkedList::toArray(LinkedList::reverse(null)));
    }
}
