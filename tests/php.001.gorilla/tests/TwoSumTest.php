<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\TwoSum;

final class TwoSumTest extends TestCase {
    public function testTwoSum(): void {
        $solver = new TwoSum();
        $this->assertEqualsCanonicalizing([0,1], $solver->find([2,7,11,15], 9));
        $this->assertEqualsCanonicalizing([1,2], $solver->find([1,3,5], 8));
        $this->assertEqualsCanonicalizing([0,2], $solver->find([4,6,2], 6));
    }
}
