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
        $leftMatch = ['(','{','['];
        $rightMatch = [')','}',']'];
        $left = [];
        $right = [];

        // TODO: stack-based check
        $arr = str_split($s);
        foreach ($arr as $b) {
            if (in_array($b, $leftMatch)) {
                array_push($left, $b);
            }
            if (in_array($b, $rightMatch)) {
                array_unshift($right, $b);
            }
            echo $left[count($left) - 1] . ' - ' . ($right[0] ? $right[0] : null) ."\n";
            if (count($left) > 0 && count($right) > 0) {
                if ($left[0] === $right[0]) {
                    array_shift($left);
                    array_shift($right);
                }
            }
        }

        var_dump($left);
        var_dump($right);
        

        throw new \RuntimeException('TODO');
    }
}
