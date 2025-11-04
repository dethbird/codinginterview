<?php
declare(strict_types=1);

namespace App;

final class TwoSum
{
    /**
     * Return indexes [i, j] such that nums[i] + nums[j] == target.
     * If multiple solutions, return any. Throw \InvalidArgumentException if none.
     * Must be O(n).
     *
     * @param array<int,int> $nums
     * @return array{0:int,1:int}
     */
    public static function indices(array $nums, int $target): array
    {
        $seen = [];
        foreach ($nums as $i => $num) {
            $complement = $target - $num;
            if (isset($seen[$complement])) {
                return ([$seen[$complement], $i]);
            }
            $seen[$num] = $i;
        }
        throw new \InvalidArgumentException('No indices match target');
    }
}
