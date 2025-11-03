<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\BalancedBrackets;

final class BalancedBracketsTest extends TestCase
{
    public function testValid(): void
    {
        $this->assertTrue(BalancedBrackets::isValid('()[]{}'));
        $this->assertTrue(BalancedBrackets::isValid('{[()()]}'));
    }

    public function testInvalid(): void
    {
        $this->assertFalse(BalancedBrackets::isValid('(]'));
        $this->assertFalse(BalancedBrackets::isValid('([)]'));
        $this->assertFalse(BalancedBrackets::isValid('((('));
    }
}
