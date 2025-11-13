<?php
declare(strict_types=1);

namespace App;

final class RomanNumerals
{
    /**
     * Convert a roman numeral (e.g. "MCMXCIV") to an integer.
     * Assume valid uppercase input.
     */
    public static function toInt(string $s): int
    {
        // start by reversing the string
        // roman numerals are calculated by the previous letter subtracted if less than current character
        // check against map of character -> int
        $map = [
            'M' => 1000,
            'D' => 500,
            'C' => 100,
            'L' => 50,
            'X' => 10,
            'V' => 5,
            'I' => 1
        ];

        $value = 0;
        $last = null;
        $sRev = array_reverse(str_split($s));
        
        foreach($sRev as $n) {
            if (is_null($last)) {
                $value += $map[$n];
            } else if ($map[$last] <= $map[$n]) {
                $value += $map[$n];
            } else if ($map[$last] > $map[$n]) {
                $value -= $map[$n];
            } 
            $last = $n;
        }

        return (int) $value;

        throw new \RuntimeException('TODO');
    }
}
