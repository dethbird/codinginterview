<?php
declare( strict_types = 1 );

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\LinkedList;

final class LinkedListTest extends TestCase {
    public function testReverse(): void {
        $head = LinkedList::fromArray( [ 1, 2, 3, 4 ] );
        $rev = LinkedList::reverse( $head );
        $this->assertSame( [ 4, 3, 2, 1 ], LinkedList::toArray( $rev ) );
        $this->assertSame( [], LinkedList::toArray( LinkedList::reverse( null ) ) );
    }

    public function testPushFront(): void {
        $list = new \App\LinkedList();
        // Initially empty
        $this->assertSame( [], \App\LinkedList::toArray( $list->head ?? null ) );

        // Push values to front: 3, then 2, then 1
        $list->pushFront( 3 );
        $list->pushFront( 2 );
        $list->pushFront( 1 );

        // Should be [ 1, 2, 3 ]
        $this->assertSame( [ 1, 2, 3 ], \App\LinkedList::toArray( $list->head ?? null ) );
    }

}
