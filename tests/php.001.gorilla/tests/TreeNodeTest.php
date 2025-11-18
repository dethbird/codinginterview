<?php
declare( strict_types = 1 );

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\Stringo;

final class TreeNodeTest extends TestCase {

    public function testLevelOrder(): void {
        // Build tree:
        //      1
        //     / \
        //    2   3
        //   /   / \
        //  4   5   6
        $root = new \App\TreeNode(1,
            new \App\TreeNode(2,
                new \App\TreeNode(4)
            ),
            new \App\TreeNode(3,
                new \App\TreeNode(5),
                new \App\TreeNode(6)
            )
        );

        $expected = [
            [1],
            [2, 3],
            [4, 5, 6]
        ];
        $this->assertSame($expected, $root->levelOrder($root));

        // Edge case: null root
        $this->assertSame([], $root->levelOrder(null));
    }

}
