<?php
declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\Slugify;

final class SlugifyTest extends TestCase
{
    public function testSlug(): void
    {
        $this->assertSame('hello-world', Slugify::slug('Hello,  World!'));
        $this->assertSame('naive-cafe', Slugify::slug('naïve café'));
        $this->assertSame('a-b-c', Slugify::slug('---A  B__C---'));
    }
}
