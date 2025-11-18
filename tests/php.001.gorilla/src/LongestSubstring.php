<?php
declare(strict_types=1);

namespace App;

function lengthOfLongestSubstring(string $s): int {
    $n = strlen($s);
    $lastIndex = [];    // char => last seen index
    $left = 0;
    $best = 0;

    for ($right = 0; $right < $n; $right++) {
        $ch = $s[$right];
        if (isset($lastIndex[$ch]) && $lastIndex[$ch] >= $left) {
            $left = $lastIndex[$ch] + 1;   // slide left past previous occurrence
        }
        $lastIndex[$ch] = $right;
        $best = max($best, $right - $left + 1);
    }

    return $best;
}

/**
 * function lengthOfLongestSubstring(string $s): int {
    $stack = [];
    $longest = 0;
    for ($i = 0; $i < strlen($s); $i++) {
        $char = $s[$i];
        if (!in_array($char, $stack)) {
            $stack[] = $char;
        } else {
            $stack = [$char];
        }
        $longest = count($stack) > $longest ? count($stack) : $longest;
    }
    return $longest;
}
 */