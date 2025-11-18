<?php
declare(strict_types=1);

namespace App;

final class Stringo
{

    public static function firstUniqueChar(string $s): int
    {
        $hash = [];
        if (strlen($s) < 1)  {
            return -1;
        }
        for ($i = 0; $i < strlen($s); $i++){
            $char = $s[$i];
            if (!isset($hash[$char])) {
                $hash[$char] = 0;
            }
            $hash[$char]++;
        }
        for ($i = 0; $i < strlen($s); $i++) {
            if ($hash[$s[$i]] == 1) {
                return $i;
            }
        }
        return -1;
    }
}
