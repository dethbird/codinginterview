<?php
declare(strict_types=1);

namespace App\Tests;

// ensure the implementation is loaded when autoload isn't configured for this test directory
require_once __DIR__ . '/../src/LongestSubstring.php';

use PHPUnit\Framework\TestCase;
use function App\lengthOfLongestSubstring;

final class LongestSubstringTest extends TestCase {
    public function testLengthOfLongestSubstring(): void {
        $this->assertSame(3, lengthOfLongestSubstring("abcabcbb"));
        $this->assertSame(1, lengthOfLongestSubstring("bbbbb"));
        $this->assertSame(3, lengthOfLongestSubstring("pwwkew"));
        $this->assertSame(0, lengthOfLongestSubstring(""));
    }
}
