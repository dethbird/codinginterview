<?php
declare(strict_types=1);

namespace App;

final class Anagram
{
    /**
     * Return true if $a and $b are anagrams, ignoring case, spaces, and punctuation.
     * Examples: "listen" vs "silent", "Dormitory" vs "Dirty room!!"
     */
    public static function isAnagram(string $a, string $b): bool
    {
        // TODO: implement
        // 1) Keep only letters/numbers, lowercase
        $aParsed = preg_replace('/[^a-z0-9]/i', '', strtolower($a));
        $bParsed = preg_replace('/[^a-z0-9]/i', '', strtolower($b));

        // 2) Sort characters and compare
        $aChars = str_split($aParsed);
        $bChars = str_split($bParsed);
        sort($aChars);
        sort($bChars);  

        return $aChars === $bChars;

    }
}
