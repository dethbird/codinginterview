<?php
declare( strict_types = 1 );

namespace App;

final class TreeNode {

    public function __construct(
        public int $val,
        public ?TreeNode $left = null,
        public ?TreeNode $right = null,
    ) {
    }

    /**
    * // recursively return this $val appended to the current level array along with the next level array composed of recursive calls to children
    * // each call needs to know what level it is and add a next level array of it's level and right children concatenated
    * @return int[][]
    */

    public function levelOrder( ?TreeNode $root ): array {
        if ( $root === null ) {
            return [];
        }
        $result = [];
        $queue = [ $root ];
        while ( !empty( $queue ) ) {
            $level = [];
            $nextQueue = [];
            foreach ( $queue as $node ) {
                $level[] = $node->val;
                if ( $node->left !== null ) {
                    $nextQueue[] = $node->left;
                }
                if ( $node->right !== null ) {
                    $nextQueue[] = $node->right;
                }
            }
            $result[] = $level;
            $queue = $nextQueue;
        }
        return $result;
    }
}
//     public function levelOrder( ?TreeNode $root, $level = null, $levelArray = [] ): array {
//         // @todo: BFS using a queue

//         if ( is_null( $root ) ) {
//             return $levelArray;
//         }
//         if ( is_null( $level ) ) {
//             $level = 0;
//         }
//         if ( !isset( $levelArray[ $level ] ) ) {
//             $levelArray[ $level ] = [];
//         }
//         $levelArray[ $level ][] = $root->val;

//         $leftArray = $this->levelOrder( $root->left, $level + 1, $levelArray );
//         $rightArray = $this->levelOrder( $root->right, $level + 1, $levelArray );

//         if ( count( $leftArray ) || count( $rightArray ) ) {

//         }

//     }
// }
