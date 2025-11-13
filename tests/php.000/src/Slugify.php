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
        if (strlen($s) < 3) {
            return $s;
        }

        // replace alphanumeric with '-'
        $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        $slug = strtolower($s);
        $slug = preg_replace('/[^a-zA-Z]/', '-', $slug);
        $slug = trim($slug, "-");
        $slug = preg_replace('/-+/', '-', $slug);
        return $slug;
    }
}
