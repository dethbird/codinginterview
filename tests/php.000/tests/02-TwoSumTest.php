<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\TwoSum;

final class TwoSumTest extends TestCase
{
    public function testFindsIndices(): void
    {
        $this->assertEqualsCanonicalizing([1,2], TwoSum::indices([2,7,11,15], 18));
    }

    public function testThrowsWhenNoSolution(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TwoSum::indices([1,2,3], 100);
    }
}
