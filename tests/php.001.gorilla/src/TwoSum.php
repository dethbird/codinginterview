<?php
declare(strict_types=1);

namespace App;

class TwoSum {
    function find(array $nums, int $target): array {
        // One-pass hashmap approach: O(n) time, O(n) extra space
        $map = [];
        foreach ($nums as $i => $n) {
            $need = $target - $n;
            if (isset($map[$need])) {
                return [$map[$need], $i];
            }
            // store index of current number
            $map[$n] = $i;
        }
        return [];
    }

    /**
     * function find(array $nums, int $target): array {
        $checked = [];
        for ($i = 0; $i < count($nums); $i++)  {
            $complement = $target - $nums[$i];
            for($j = 0; $j < count($nums); $j++) {
                if ($nums[$j] === $complement) {
                    return [$i, $j];
                }
            }
        }
        return [];
        
    }
     */
}
