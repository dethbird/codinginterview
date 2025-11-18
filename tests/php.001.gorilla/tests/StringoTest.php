<?php
declare( strict_types = 1 );

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\Stringo;

final class StringoTest extends TestCase {

    public function testFirstUniqueChar(): void {
        $this->assertSame(0, Stringo::firstUniqueChar("leetcode"));      // 'l'
        $this->assertSame(2, Stringo::firstUniqueChar("loveleetcode"));  // 'v'
        $this->assertSame(-1, Stringo::firstUniqueChar("aabb"));         // none
    }

}
