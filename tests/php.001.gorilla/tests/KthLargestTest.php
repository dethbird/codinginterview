<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\KthLargest;

final class KthLargestTest extends TestCase {
    public function testKthLargestInstance(): void {
        // Example: [3,2,1,5,6,4], k=2 => 5
        $nums = [3,2,1,5,6,4];
        $k = 2;
        $kl = new KthLargest($k, $nums);
        $this->assertSame(5, $kl->add(0)); // add a dummy value, should still return 5

        // Example: [3,2,3,1,2,4,5,5,6], k=4 => 4
        $nums2 = [3,2,3,1,2,4,5,5,6];
        $k2 = 4;
        $kl2 = new KthLargest($k2, $nums2);
        $this->assertSame(4, $kl2->add(0));

        // Edge case: k=1 (largest)
        $nums3 = [7,8,9];
        $k3 = 1;
        $kl3 = new KthLargest($k3, $nums3);
        $this->assertSame(9, $kl3->add(0));

        // Edge case: k=length (smallest)
        $nums4 = [7,8,9];
        $k4 = 3;
        $kl4 = new KthLargest($k4, $nums4);
        $this->assertSame(7, $kl4->add(0));
    }
}
