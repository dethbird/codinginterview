<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class InvertTreeTest extends TestCase {
    public function testInvertTree(): void {
        $root = new \App\TreeNode(4,
            new \App\TreeNode(2,
                new \App\TreeNode(1),
                new \App\TreeNode(3)
            ),
            new \App\TreeNode(7,
                new \App\TreeNode(6),
                new \App\TreeNode(9)
            )
        );
        $inverted = invertTree($root);
        $this->assertSame(4, $inverted->val);
        $this->assertSame(7, $inverted->left->val);
        $this->assertSame(2, $inverted->right->val);
        $this->assertSame(9, $inverted->left->left->val);
        $this->assertSame(6, $inverted->left->right->val);
        $this->assertSame(3, $inverted->right->right->val);
        $this->assertSame(1, $inverted->right->left->val);
    }
}
