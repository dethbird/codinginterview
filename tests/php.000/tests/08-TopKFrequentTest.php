<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\TopKFrequent;

final class TopKFrequentTest extends TestCase
{
    public function testFind(): void
    {
        $out = TopKFrequent::find([1,1,1,2,2,3], 2);
        sort($out);
        $this->assertSame([1,2], $out);
    }

    public function testKEqualsOne(): void
    {
        $out = TopKFrequent::find([4,4,4,5,5,6], 1);
        $this->assertSame([4], $out);
    }
}
