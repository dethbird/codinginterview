<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\RomanNumerals;

final class RomanNumeralsTest extends TestCase
{
    public function testExamples(): void
    {
        $this->assertSame(3, RomanNumerals::toInt('III'));
        $this->assertSame(4, RomanNumerals::toInt('IV'));
        $this->assertSame(9, RomanNumerals::toInt('IX'));
        $this->assertSame(58, RomanNumerals::toInt('LVIII')); // L=50 V=5 III=3
        $this->assertSame(1994, RomanNumerals::toInt('MCMXCIV')); // 1000 + 900 + 90 + 4
    }
}
