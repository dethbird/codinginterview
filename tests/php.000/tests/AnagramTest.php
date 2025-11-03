<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\Anagram;

final class AnagramTest extends TestCase
{
    public function testSimple(): void
    {
        $this->assertTrue(Anagram::isAnagram('listen', 'silent'));
        $this->assertFalse(Anagram::isAnagram('apple', 'pale'));
    }

    public function testIgnoresCaseAndSpaces(): void
    {
        $this->assertTrue(Anagram::isAnagram('Dormitory', 'Dirty room!!'));
        $this->assertTrue(Anagram::isAnagram('Astronomer', 'Moon starer'));
    }
}
