<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class NumIslandsTest extends TestCase {
    public function testNumIslands(): void {
        $grid1 = [
            ["1","1","1","1","0"],
            ["1","1","0","1","0"],
            ["1","1","0","0","0"],
            ["0","0","0","0","0"],
        ];
        $this->assertSame(1, numIslands($grid1));

        $grid2 = [
            ["1","1","0","0","0"],
            ["1","1","0","0","0"],
            ["0","0","1","0","0"],
            ["0","0","0","1","1"],
        ];
        $this->assertSame(3, numIslands($grid2));
    }
}
