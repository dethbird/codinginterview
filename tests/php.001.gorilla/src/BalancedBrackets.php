<?php
declare(strict_types=1);

namespace App;

final class BalancedBrackets
{
    /**
     * Return true if brackets (), {}, [] are balanced and properly nested.
     */
    public static function isValid(string $s): bool
    {

        $matches = ['(' => ')', '{' => '}', '[' => ']'];
        $stack = [];
        for ($i = 0; $i < strlen($s); $i++) {
            // opening char
            if (array_key_exists($s[$i], $matches)) {
                $stack[] = $s[$i];
                continue;
            }
            // closing char?
            if (!in_array($s[$i], $matches)) {
                return false;
            } else {
                $opener = array_pop($stack);
                if ($matches[$opener] !== $s[$i]) {
                    return false;
                }
            }
        }
        return empty($stack);
    }
}
