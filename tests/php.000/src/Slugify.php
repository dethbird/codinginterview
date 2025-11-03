<?php
declare(strict_types=1);

namespace App;

final class Slugify
{
    /**
     * Convert string to URL slug:
     * - lowercase
     * - replace non alphanumerics with '-'
     * - collapse multiple '-' into one
     * - trim '-' from ends
     */
    public static function slug(string $s): string
    {
        // TODO: implement
        throw new \RuntimeException('TODO');
    }
}
