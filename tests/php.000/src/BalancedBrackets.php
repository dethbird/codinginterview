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
        $pairs = [')' => '(', '}' => '{', ']' => '['];
        $stack = [];

        $len = strlen($s);
        for ($i = 0; $i < $len; $i++) {
            $ch = $s[$i];

            // opening bracket -> push
            if ($ch === '(' || $ch === '{' || $ch === '[') {
                $stack[] = $ch;
                continue;
            }

            // closing bracket -> must match top of stack
            if (isset($pairs[$ch])) {
                if (empty($stack)) {
                    return false;
                }
                $top = array_pop($stack);
                if ($top !== $pairs[$ch]) {
                    return false;
                }
            }
            // ignore other characters
        }

        return empty($stack);
    }
}
